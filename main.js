const express = require('express')
const app = express() // express module을 함수처럼 가져왔다. 이는, express모듈은 함수라는 뜻!!
var fs = require('fs');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var qs = require('querystring');
var bodyParser = require('body-parser')
var compression = require('compression')

// 폼 형식으로 받은 데이터 (post 데이터 받는 부분)
app.use(bodyParser.urlencoded({ extended: false }))
/*bodyParser.urlencoded({ extended: false }) :
 bodyParser가 만들어 내는 middleware를 만들어 내는 표현식 */

app.use(compression());
// compression 모듈 호출
// compression() : 함수 ==> 미들웨어를 리턴하도록 하고,
// 그 미들웨어 ==> app.use로 장착된다. 



// route, routing : 네비게이션. 사용자들이 여러 path로 왔을 때, 그 경로를 설정해준다. 

// 1. 홈페이지 구현.
app.get('/', (request, response) => {
  fs.readdir('./data', (error, filelist) => {
    var title = 'Welcome';
    var description = 'Hello, Node.js';
    var list = template.list(filelist);
    var html = template.HTML(title, list,
      `<h2>${title}</h2>${description}`,
      `<a href="/create">create</a>`
    );
    response.send(html);
  });
})

// 2. 상세페이지 구현
// 시멘틱  url 로 작성 ; queryString을 쓰지 않고, path로만 작성
app.get('/page/:pageId', (request, response) => {
  fs.readdir('./data', function (error, filelist) {
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ['h1']
      });
      var list = template.list(filelist);
      var html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/create">create</a>
            <a href="/update/${sanitizedTitle}">update</a>
            <form action="/delete_process" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`
      );
      response.send(html);
    });
  });
})



// 3.create 
/* action 의 path : 
 왜 같은 /create 경로로 전송하지??? 
 접근 할 때 get 방식으로 접근하면, app.get('/create')에 걸릴것이고
 데이터를 전홀 할 때, post방식으로 접근하면, app.post('/create')에 걸린다.!!
*/
app.get('/create', (request, response) => {
  fs.readdir('./data', function (error, filelist) {
    var title = 'WEB - create';
    var list = template.list(filelist);
    var html = template.HTML(title, list, `
        <form action="/create" method="post">
          <p><input type="text" name="title" placeholder="title"></p>
          <p>
            <textarea name="description" placeholder="description"></textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
      `, '');
    response.send(html);
  });
})

app.post('/create', (request, response) => {
  /*
  var body = '';
  // post방식은 get방식과 다르게 큰 data를 받을 수 있다.  
  // data가 추가 될 떄마다 request.on이 호출.
  request.on('data', function (data) {
    body = body + data;
  });
  // data가 없다고 했을 때 실행
  request.on('end', function () {
    var post = qs.parse(body);
    var title = post.title;
    var description = post.description;
    fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
      response.writeHead(302, { Location: `/page/${title}` });
      response.end();
    })
  });
  */
  //post는 body-parser 부분!
  var post = request.body;
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
    response.writeHead(302, { Location: `/page/${title}` });
    response.end();
  });
})

//4.Update
app.get('/update/:pageId', (request, response) => {
  fs.readdir('./data', function (error, filelist) {
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
      var title = request.params.pageId;
      var list = template.list(filelist);
      var html = template.HTML(title, list,
        `
          <form action="/update_process" method="post">
            <input type="hidden" name="id" value="${title}">
            <p><input type="text" name="title" placeholder="title" value="${title}"></p>
            <p>
              <textarea name="description" placeholder="description">${description}</textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
          `,
        `<a href="/create">create</a> <a href="/update/${title}">update</a>`
      );
      response.send(html);
    });
  });
})

app.post('/update_process', function (request, response) {
  //post는 body-parser 부분!
  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
      // response.writeHead(302, { Location: `/page/${title}` });
      // response.end();
      response.redirect(`/page/${title}`);
    })
  });
});


// 5. Delete
app.post('/delete_process', function (request, response) {
  //post는 body-parser 부분!
  var post = request.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    response.redirect('/');
    // express에서 제공하는 redirect 
    // Google : nodejs express redirect 로 검색
    /*기존: 
      response.writeHead(302, { Location: `/` });
      response.end();*/
  })
});



app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

/*
var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === '/') {
    if (queryData.id === undefined) {
      // 홈페이지
    } else {
      // 상세페이지
    }
  } else if (pathname === '/create') {
     // create -  get
  } else if (pathname === '/create_process') {
     //  create - post
    });
  } else if (pathname === '/update') {
    // update - get
  } else if (pathname === '/update_process') {
    // update -  post
  } else if (pathname === '/delete_process') {
    // delete - post
  } else {
    response.writeHead(404);
    response.end('Not found');
  }
});
app.listen(3000);
*/