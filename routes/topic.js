// topic 이라고 시작하는 주소들을 이주시킴.

var express = require('express') // express를 로딩시킴
var router = express.Router() // express.Router() 메소드를 실행 -> router라는 객체를 return
// express가 같고있는 Router메소드를 호출 
// Router 를 리턴
var template = require('../lib/template.js');
var path = require('path');
var fs = require('fs');
var sanitizeHtml = require('sanitize-html');




// 3.create 
router.get('/create', (request, response) => {
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
router.post('/create', (request, response) => {
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
router.get('/update/:pageId', (request, response) => {
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

router.post('/update_process', function (request, response) {
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
router.post('/delete_process', function (request, response) {
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

// 2. 상세페이지 구현 (/topic/path로 들어온 페이지 처리)
// 시멘틱  url 로 작성 ; queryString을 쓰지 않고, path로만 작성
// Err가 있는 경우 next를 호출한다. 
router.get('/:pageId', (request, response, next) => {
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

module.exports = router;







