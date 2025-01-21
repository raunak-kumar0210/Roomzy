const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review=require("./models/review.js");


module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in to create listing!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }
        if (!listing.owner._id.equals(res.locals.currUser._id)) {
            req.flash("error", "You are not the owner of the listing");
            return res.redirect(`/listings/${id}`);
        }
        next(); // Call next() to proceed
    } catch (err) {
        console.error("Error in isOwner middleware:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect("/listings");
    }
};


module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}


module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;
        const review = await Review.findById(reviewId);
        if (!review) {
            req.flash("error", "Review not found!");
            return res.redirect(`/listings/${id}`);
        }
        if (!review.author.equals(res.locals.currUser._id)) {
            req.flash("error", "You are not the author of this review");
            return res.redirect(`/listings/${id}`);
        }
        next(); // Call next() to proceed
    } catch (err) {
        console.error("Error in isReviewAuthor middleware:", err);
        req.flash("error", "Something went wrong!");
        return res.redirect(`/listings/${id}`);
    }
};

