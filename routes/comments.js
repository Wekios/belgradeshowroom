const express = require("express");
const router  = express.Router({mergeParams: true});
const club = require("../models/club");
const Comment = require("../models/comment");
const middleware = require("../middleware");
const { isLoggedIn, checkUserComment, isAdmin } = middleware;

//Comments New
router.get("/new", isLoggedIn, function(req, res){
    // find club by id
    console.log(req.params.id);
    club.findById(req.params.id, function(err, club){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {club: club});
        }
    })
});

//Comments Create
router.post("/", isLoggedIn, function(req, res){
   //lookup club using ID
   club.findById(req.params.id, function(err, club){
       if(err){
           console.log(err);
           res.redirect("/clubs");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               club.comments.push(comment);
               club.save();
               console.log(comment);
               req.flash('success', 'Created a comment!');
               res.redirect('/clubs/' + club._id);
           }
        });
       }
   });
});

router.get("/:commentId/edit", isLoggedIn, checkUserComment, function(req, res){
  res.render("comments/edit", {club_id: req.params.id, comment: req.comment});
});

router.put("/:commentId", isAdmin, function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
          console.log(err);
           res.render("edit");
       } else {
           res.redirect("/clubs/" + req.params.id);
       }
   }); 
});

router.delete("/:commentId", isLoggedIn, checkUserComment, function(req, res){
  // find club, remove comment from comments array, delete comment in db
  club.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, function(err) {
    if(err){ 
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.comment.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Comment deleted!');
          res.redirect("/clubs/" + req.params.id);
        });
    }
  });
});

module.exports = router;