import { Router } from "express";
import { listListings, getListingById, incrementListingViewsRPC } from "../services/listingService.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { category, search, location, limit, offset } = req.query;
    
    const listings = await listListings({
      category: category as string,
      search: search as string,
      location: location as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    
    res.json(listings);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await getListingById(id);
    if (!listing) {
      res.status(404).json({ error: "NotFound", message: "Listing not found" });
      return;
    }
    
    // Increment views as side product of getting the detailed listing
    await incrementListingViewsRPC({ listingId: id });
    
    res.json(listing);
  } catch (error) {
    next(error);
  }
});

export default router;
