const express = require('express')
const app = express() // express module을 함수처럼 가져왔다. 이는, express모듈은 함수라는 뜻!!
var fs = require('fs');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var qs = require('querystring');
var bodyParser = require('body-parser')
var compression = require('compression')

//'public' directory 안에서 static 파일을 찾겠다!! 라고 직접 지정
app.use(express.static('public'))
// 'public' directory 안의 파일 or directory 만 url을 통해 접근한다 
// ==> 여기만 접근허용이므로, 훨씬 안전해짐. 

app.use(bodyParser.urlencoded({ extended: false }))
app.use(compression());
app.get('*', (request, response, next) => {
  fs.readdir('./data', (error, filelist) => {
    request.list = filelist;
    next();
  })
})
// route, routing : 네비게이션. 사용자들이 여러 path로 왔을 때, 그 경로를 설정해준다. 

// 1. 홈페이지 구현.
app.get('/', (request, response) => {
  var title = 'Welcome';
  var description = 'Hello, Node.js';
  var list = template.list(request.list);
  var html = template.HTML(title, list,
    `<h2>${title}</h2>${description},
    <img src="/images/hello.jpg" style="width:400px; display:block; margin-top:10px">`,
    `<a href="/create">create</a>`
  );
  response.send(html);

})

// 2. 상세페이지 구현
// 시멘틱  url 로 작성 ; queryString을 쓰지 않고, path로만 작성
app.get('/page/:pageId', (request, response) => {
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    var title = request.params.pageId;
    var sanitizedTitle = sanitizeHtml(title);
    var sanitizedDescription = sanitizeHtml(description, {
      allowedTags: ['h1']
    });
    var list = template.list(request.list);
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

})



// 3.create 
/* action 의 path : 
 왜 같은 /create 경로로 전송하지??? 
 접근 할 때 get 방식으로 접근하면, app.get('/create')에 걸릴것이고
 데이터를 전홀 할 때, post방식으로 접근하면, app.post('/create')에 걸린다.!!
*/
app.get('/create', (request, response) => {
  var title = 'WEB - create';
  var list = template.list(request.list);
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

})

app.post('/create', (request, response) => {
  console.log(request.list)
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
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    var title = request.params.pageId;
    var list = template.list(request.list);
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

