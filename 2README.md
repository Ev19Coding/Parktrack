# Main Features / Stuff to Note

ParkTrack is an image foward geolocation application for parks, and resturants in amac, abuja that has a map feature with location markers and individual popups that lead to the specific location info page. It's main features include:

- Search feature that filters locations (parks and resturants seperately) by neighbourhood, proximity to user, alphabetically, and ratings on the landing page same with the map, 2 location sliders for parks and resturants individually on the landing page below the map (has name, entry fee and neighbourhood shown when hovered on) which when pushed also leads to the responding location info page.
  - Quite doable, the ratings might be an issue if the data doesn't already exist, although I think it should exist if google maps / any other map api exposes that.

- The location information page has a breakdown of activities offered, fee for individual activity, images of activities offered in (should be ordered as activity-images of that activity-price for that activity) and how to contact the locations for bookings, orders and reservations (since in-system booking would be complex and might lead to some spicy legal trouble).
  - Mmm, scraping :3. Just setup a small database or even a local folder and scrape the data from the sites every once in a while.

- admin portal accessible only by the admin of course (so access control) to add some new locations, categories and subcategories.
  - What's the difference between this and **owner**s? Is it really essential for the first prototype?

- Owner portal unlocked by users that sign in their park or resturant location on the system, they are able to view user traffic on viewing their location, reviews left by regular users, and edit time, location, activities, activity fee, images and event changes directly on their portal.
  - You'll definitely need a database and auth for this, which will take a while. Do you have any databases in mind? Are you familiar enough with SQL?

- Users should be able to leave reviews with images and star based ratings, compare and contrast between different locations based on other user ratings, distance to the user and through prices without signins up.
  - Need database and auth, but drastically simpler than the previous requirement imo. Very possible to do this.

- Other useful features to look into including are:
  - User favorites list (bookmark parks/restaurants).
    - A database or the browser's storage can be used.

  - Event calendar per park/restaurant (owners add events).
    - I'll need to properly understand this later.

  - Push notifications for events (optional, via Firebase).
    - Push notifications aren't necessarily difficult unless you're dealing with older iphones or smth.

  - Image gallery per location (user + owner uploads).
    - Need to understand this later, but accepting image uploads will require another whole moderation service.

  - Direction button → link to Google Maps directions.
    - Ez, assuming we simply redirect them to google maps.
