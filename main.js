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
    `<a href="/topic/create">create</a>`
  );
  response.send(html);

})

// 3.create 
app.get('/topic/create', (request, response) => {
  var title = 'WEB - create';
  var list = template.list(request.list);
  var html = template.HTML(title, list, `
        <form action="/topic/create" method="post">
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
app.post('/topic/create', (request, response) => {
  console.log(request.list)
  //post는 body-parser 부분!
  var post = request.body;
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
    // response.writeHead(302, { Location: `/topic/${title}` });
    // response.end();
    response.redirect(`/topic/${title}`); //리다이렉트 
  });
})

//4.Update
app.get('/topic/update/:pageId', (request, response) => {
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    var title = request.params.pageId;
    var list = template.list(request.list);
    var html = template.HTML(title, list,
      `
          <form action="/topic/update_process" method="post">
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
      `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`
    );
    response.send(html);
  });

})

app.post('/topic/update_process', function (request, response) {
  //post는 body-parser 부분!
  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
      // response.writeHead(302, { Location: `/topic/${title}` });
      // response.end();
      response.redirect(`/topic/${title}`);
    })
  });
});

// 5. Delete
app.post('/topic/delete_process', function (request, response) {
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

app.use(function (req, res, next) {
  res.status(404).send('Sorry cant find that!');
});


// 2. 상세페이지 구현 (/topic/path로 들어온 페이지 처리)
// 시멘틱  url 로 작성 ; queryString을 쓰지 않고, path로만 작성
// Err가 있는 경우 next를 호출한다. 
app.get('/topic/:pageId', (request, response, next) => {
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    /* fs.readFile(`data/${filteredId}`, 'utf8', function (err, description)
     ; data/${filteredId}에서 file을 읽는데, 그 파일이 없다면 callback함수의 
     첫번째 param으로 Error 객체를 전달하도록 되어잇따. */
    if (err) { //err 가 발생한다면
      next(err); // next를 통해서 다음 middleWare를 던져준다.
      // 인자로 'route'를 전달해도 다음 미들웨어를 실행시킴
      // 그 외의 데이터가 들어오면, err라는 약속 체결되어있다.
      // next(err); 는 err데이터를 전달해 주면, err를 던지는 것이다
    } else {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ['h1']
      });
      var list = template.list(request.list);
      var html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/topic/create">create</a>
              <a href="/topic/update/${sanitizedTitle}">update</a>
              <form action="/topic/delete_process" method="post">
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value="delete">
              </form>`
      );
      response.send(html);
    }

  });
})








/* status Code : 404 밑에 놔야함.
*  이, Err Handling을 위한 middleWare는 특이하게도,4개의 인자를 받는다. 
  위에서 실행 된 **_next(err)함수 로부터_** 첫번째 Err인자에 Err 데이터가 담긴다.
* _4개의 인자를 가지고 있는 함수_는
  express에서는 Err를 핸들링 하기 위한 MiddleWare로 약속이 되어 있다.. 
* 실행 순서 > 
  1. 상세페이지에서 페이지를 찾을 수 없는 경우 _**if(err)**_에 걸려, next(err) 함수가 실행
    2. 이 next(err) 함수 : 뒤로 어떤 미들웨어가 등록되어 있든지 싹 다 무시하고 제일_** 맨 끝의 밑의 인자가 4개인 함수로**_서 등록된 미들웨어가 호출된다.
    3. 그 첫번째 자리로 Err 데이터가 전달된다. 
*/
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})

