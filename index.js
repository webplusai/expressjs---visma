var express     	=   require('express');
var web_routes  	=   require('./routes/web');
var api_routes  	=   require('./routes/api');
var bodyParser  	=   require('body-parser');
var app         	=   express();
var cookieParser 	= 	require('cookie-parser');
var session 		=	require('express-session');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
})); 

app.set('view engine', 'pug');
app.set('views', './views');

app.use('/', web_routes);
app.use('/api', api_routes);
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/config', express.static('config'));
app.use(cookieParser());
app.use(session());
app.listen(process.env.PORT || 3000)
