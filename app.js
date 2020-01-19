var express 	= require("express");
var app 		= express();
var bodyParser 	= require("body-parser");
var mongoose 	= require("mongoose");
var methodOverride =  require("method-override"),
	passport = require("passport"),
	localStrategy = require("passport-local"), 
	passportLocalMongoose= require("passport-local-mongoose");


mongoose.connect("mongodb://localhost/phylancerv6");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));

//==================================== 

		//Schema Setup

//==================================== 




//bid Schema setup


var bidSchema = new mongoose.Schema({
	user : {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}, 
		username: String
	},
	comment: String,
	amount : Number
});
var bid = mongoose.model("bid", bidSchema);


// job schema setup  
var jobsSchema = new mongoose.Schema({
	name: String,
	description: String,
	phone: Number,
	image: String,
	location: String,
	user: {
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username:String

	},
	bid : [
	{
		type : mongoose.Schema.Types.ObjectId,
		ref : "bid"
	}
	]

});

var job = mongoose.model("job", jobsSchema);



var UserSchema = new mongoose.Schema({
	usename: String,
	password: String,
	location: String,
	ratings: Number,
	age: Number,
	sex: String,
	imgProfile: String,
	fullname: String, 
	email: String,
	phone: String


});
UserSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", UserSchema);


//passport config

app.use(require("express-session")({
	secret: "This is secret",
	resave : false,
	saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
})




//Register form and handling routes..


app.get("/register", function(req, res){
	res.render("register");
});
 app.post("/register", function(req,res){
 	var newUser = new User({username: req.body.username});
 	User.register(newUser, req.body.password, function(err, user){
 		if (err) {
 			console.log(err);
 			return res.render("register");
 		}else{
 			passport.authenticate("local")(req, res, function(){
 				res.redirect("/jobs");
 			})
 		}
 	})
 });



//login logic and routes
app.get("/login", function(req, res){
	res.render("login");
});

app.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/jobs",
		failureRedirect: "/login"
	}), function(req, res){

});	


//logout logic and routes
app.get("/logout", function(req,res){
	req.logout();
	res.redirect("/login");
});




//==================================== 

		//All routes

//==================================== 



app.get("/", function(req, res) {
	res.render("landing");
});


app.get("/jobs", function(req, res) {

	// get all jobs from db
	job.find({}, function(err, nowjobs){
		if (err) {
			console.log(err);
		}else{
			res.render("jobs", {jobs: nowjobs});
		}
	})
	
});

app.post("/jobs",isLoggedIn, function(req, res){
	var name= req.body.name;
	var description= req.body.description;
	var phone= req.body.phone;
	var image= req.body.image;
	var user = {
		id : req.user._id,
		username : req.user.username
	}


	var newJob = {name: name, description: description, phone:phone, image:image, user: user};
	// save jobs to the database
	job.create(newJob, function(err, newlyJob){
		if (err) {
			console.log(err);
		}else{
			res.redirect("/jobs");
		}

	});
	

});
app.get("/postdetails/:id",isLoggedIn, function(req, res){
	job.findById(req.params.id).populate("bid").exec(function(err, job){
		if (err) {
			res.render("/");
		}else{
			res.render("posts", {job: job});
		}
	})
	
	
});

//===========================
// Bidding routes
//===========================


app.get("/postdetails/:id/bid/new",isLoggedIn, function(req, res){
	job.findById(req.params.id, function(err, job){
		if (err) {
			console.log(err);
		}else{
			res.render("bid", {job : job});
		}
	})
});


app.post("/postdetails/:id/bid",isLoggedIn, function(req, res){
	job.findById(req.params.id, function(err, job){
		if (err) {
			console.log(err);
			res.send("Error occur on finding bid");
		}else{
			bid.create(req.body.bid, function(err, bid){
				if (err) {
					console.log(err);
					res.send("Error on finding data");
				}else{
					bid.user.id= req.user._id;
					bid.user.username= req.user.username;
					bid.save();
					job.bid.push(bid);
					job.save();
					res.redirect("/postdetails/"+ job._id);
				}
			});
		}
	})

});



app.get("/jobs/new",isLoggedIn, function(req, res){
	res.render("postAjob");

});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}


app.listen("3000", function() {
	console.log("Phylaner v6 started");
});
