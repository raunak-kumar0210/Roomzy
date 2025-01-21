const Listing = require("../models/listing");
const mapKey=process.env.MAP_KEY;

const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = mapKey;


module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}
module.exports.custom = async (req, res) => {
    try {
        const { category } = req.query; // Extract category from query string

        if (!category) {
            return res.status(400).send("Category is required.");
        }

        // Find listings based on the category
        const listingsByCategory = await Listing.find({ category: category });

        if (listingsByCategory.length === 0) {
            req.flash("error", "No listings found for the selected category.");
            res.redirect("/listings");
        }

        console.log(`Found ${listingsByCategory.length} listings in category: ${category}`);
        // Render the listings page with the filtered listings
        res.render("listings/index.ejs", { allListings: listingsByCategory }); // This will render index.ejs with filtered listings
    } catch (err) {
        console.error("Error handling custom route:", err);
        res.status(500).send("Internal Server Error");
    }
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs")
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async (req, res, next) => {
    const result = await maptilerClient.geocoding.forward(req.body.listing.location);


    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    newListing.geometry=result.features[0].geometry;

    let savedListing=await newListing.save();
    console.log(savedListing,"----->LISTING SAVED")

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs", { listing,originalImageUrl })
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save(); // Save changes if an image was updated
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}