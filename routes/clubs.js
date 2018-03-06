var express = require("express");
var router  = express.Router();
var club = require("../models/club");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkUserclub, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all clubs
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all clubs from DB
      club.find({name: regex}, function(err, allclubs){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allclubs);
         }
      });
  } else {
      // Get all clubs from DB
      club.find({}, function(err, allclubs){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allclubs);
            } else {
              res.render("clubs/index",{clubs: allclubs, page: 'clubs'});
            }
         }
      });
  }
});

//CREATE - add new club to DB
router.post("/", isLoggedIn, isSafe, function(req, res){
  // get data from form and add to clubs array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var cost = req.body.cost;
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || data.status === 'ZERO_RESULTS') {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newclub = {name: name, image: image, description: desc, cost: cost, author:author, location: location, lat: lat, lng: lng};
    // Create a new club and save to DB
    club.create(newclub, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to clubs page
            console.log(newlyCreated);
            res.redirect("/clubs");
        }
    });
  });
});

//NEW - show form to create new club
router.get("/new", isLoggedIn, function(req, res){
   res.render("clubs/new"); 
});

// SHOW - shows more info about one club
router.get("/:id", function(req, res){
    //find the club with provided ID
    club.findById(req.params.id).populate("comments").exec(function(err, foundclub){
        if(err || !foundclub){
            console.log(err);
            req.flash('error', 'Sorry, that club does not exist!');
            return res.redirect('/clubs');
        }
        console.log(foundclub)
        //render show template with that club
        res.render("clubs/show", {club: foundclub});
    });
});

// EDIT - shows edit form for a club
router.get("/:id/edit", isLoggedIn, checkUserclub, function(req, res){
  //render edit template with that club
  res.render("clubs/edit", {club: req.club});
});

// PUT - updates club in the database
router.put("/:id", isSafe, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost, location: location, lat: lat, lng: lng};
    club.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, club){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/clubs/" + club._id);
        }
    });
  });
});

// DELETE - removes club and its comments from the database
router.delete("/:id", isLoggedIn, checkUserclub, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.club.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.club.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'club deleted!');
            res.redirect('/clubs');
          });
      }
    })
});

module.exports = router;

