var express     	=   require('express');
var web_routes  	=   require('./routes/web');
var api_routes  	=   require('./routes/api');
var bodyParser  	=   require('body-parser');
var session 		=	require('express-session');
var app         	=   express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
})); 

app.set('view engine', 'pug');
app.set('views', './views');

app.use(session({
    cookieName: 'session',
    secret: 'secret',
    duration: 30 * 60 * 1000,
    sctiveDuration: 50 * 60 * 1000,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    resave: true,
    saveUninitialized: true
}));

app.use('/', web_routes);
app.use('/api', api_routes);
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/config', express.static('config'));
app.listen(process.env.PORT || 3000)
