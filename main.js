
const express = require('express')
const app = express() // express module을 함수처럼 가져왔다. 이는, express모듈은 함수라는 뜻!!
// express라는 모듈 자체를 호출
// Application 객체를 리턴

var fs = require('fs');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var qs = require('querystring');
var bodyParser = require('body-parser')
var compression = require('compression')
var topicRouter = require('./routes/topic') //./routes/topic 폴더를 가져온다. 

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

// '/topic'으로 주소들에게 topicRouter라는 미들웨어를 적용하겠따!! 라는 뜻.
app.use('/topic', topicRouter);
// topicRouter 이 부분에서는, /topic을 없애야 한다.
// 이 코드처럼, router를 이렇게('/topic/')지정하면
// 라우터 내부에서는 /topic을 path에다가 담을 필요가 없다.  

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

////////////
// 경로가 '/topic/'으로 시작한는 라우터를 topic.js 파일로 분리시킴
///////////

app.use(function (req, res, next) {
  res.status(404).send('Sorry cant find that')
});


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

