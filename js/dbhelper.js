/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    //return `http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:1337/restaurants/`;
  }

  static get SaveReviewURL() {
    return `http://localhost:1337/reviews/`;
  }

  static get RESTAURANT_REVIEWS() {
    return `http://localhost:1337/reviews/?restaurant_id=`;
  }

  static openDb() {
    if (!"serviceWorker" in navigator) return Promise.resolve();
    return idb.open("restaurants_db", 1, upgradeDb => {
      // call this db table endpoints since we will be storing endpoints as keys with their values
      upgradeDb.createObjectStore("endpoints");
      // call this db table offline-reviews since we will be storing reviews that were not sent to the server due to network
      upgradeDb.createObjectStore("offline-reviews", { keyPath: "createdAt" });
      upgradeDb.createObjectStore("reviews", { keyPath: "id" });
    });
  }

  static fromAPI(endpoint, callback) {
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        console.log("fromAPI returns", data);
        DBHelper.savePair(endpoint, data);
        callback(null, data);
      })
      .catch(error => {
        const err = `Request failed. Returned status of ${error}`;
        callback(err, null);
      });
  }

  static showStoredPair(endpoint) {
    return DBHelper.openDb().then(db => {
      if (!db) return;
      let tx = db.transaction("endpoints");
      let store = tx.objectStore("endpoints");
      return store.get(endpoint);
    });
  }

  // save key value pair to the db
  static savePair(endpoint, result) {
    DBHelper.openDb().then(db => {
      if (!db) return;
      let tx = db.transaction("endpoints", "readwrite");
      let store = tx.objectStore("endpoints");
      store.put(result, endpoint);
      return tx.complete;
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let restId = id || "";
    let endpoint = DBHelper.DATABASE_URL + restId;
    let request = DBHelper.showStoredPair(endpoint).then(val => {
      if (val) {
        console.log(`fromDB returns ${val}`);
        callback(null, val);
      } else DBHelper.fromAPI(endpoint, callback);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurant) => {
      if (error) {
        callback(error, null);
      } else {
        //const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    }, id);
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.photograph}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  /**
   * Send a Restaurant Review to server
   */
  static saveRestaurantReview(review, callback) {
    const appOnline = window.navigator.onLine;
    if (appOnline) {
      DBHelper.saveReviewToAPI(review, callback);
    } else {
      DBHelper.saveReviewToDB(review, null, true);
      callback(
        "You device appears to be offline, Your review will be sent to the server when you come back online",
        null
      );
    }
  }

  static saveReviewToAPI(review, callback) {
    fetch(DBHelper.SaveReviewURL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(review)
    })
      .then(res => res.json())
      .then(data => {
        DBHelper.saveReviewToDB(data, callback, false); // save to IndexedDB
      }) // Got a successfully response from the server
      .catch(errorMessage => {
        const error = `Request failed. Returned status of ${errorMessage}`;
        callback(error, null);
        console.log("failed fetch...");
        DBHelper.saveReviewToDB(review, callback, true);
      });
  }
  static saveReviewToDB(review, callback, offline) {
    let idbPromise = DBHelper.openDb();
    if (offline) {
      idbPromise.then(function(db) {
        const tx = db.transaction("offline-reviews", "readwrite");
        const reviewStore = tx.objectStore("offline-reviews");
        // save review to the DB
        review.offline = true;
        review.createdAt = Date.now();
        reviewStore.put(review);
        return tx.complete;
      });
    } else {
      idbPromise.then(function(db) {
        const tx = db.transaction("reviews", "readwrite");
        const reviewStore = tx.objectStore("reviews");
        // save the recieved review to the DB
        reviewStore.put(review);
        return tx.complete.then(() => {
          callback(null, review);
        });
      });
    }
  }

  /**
   * Fetch all restaurants reviews.
   */
  static fetchRestaurantReviews(callback, id) {
    const appOnline = window.navigator.onLine;
    if (appOnline) {
      DBHelper.fetchReviewsFromServer(callback, id);
      DBHelper.syncOfflineReviewsWithServer();
    } else {
      DBHelper.fetchReviewsFromDB(callback, id);
    }
  }

  /**
   * Fetch all restaurants review from the server.
   */
  static fetchReviewsFromServer(callback, id) {
    fetch(`${DBHelper.RESTAURANT_REVIEWS}${id}`)
      .then(res => res.json())
      .then(data => {
        DBHelper.saveReviewsToDB(data); // save to IndexedDB
        callback(null, data);
      }) // Got a successfully response from the server
      .catch(errorMessage => {
        const error = `Request failed. Returned status of ${errorMessage}`;
        callback(error, null);
      });
  }

  /**
   * Save response from the server to the database
   */
  static saveReviewsToDB(reviews) {
    const dbPromise = idb.open("restaurants_db");
    dbPromise.then(function(db) {
      const tx = db.transaction("reviews", "readwrite");
      const reviewstore = tx.objectStore("reviews");
      // save the recieved reviews to the DB
      reviews.forEach(function(review) {
        reviewstore.put(review);
        return tx.complete;
      });
      return reviewstore.getAll();
    });
  }

  /**
   * Retrieve response from the database
   *
   */
  static fetchReviewsFromDB(callback, id) {
    const dbPromise = idb.open("restaurants_db");
    dbPromise
      .then(function(db) {
        const tx = db.transaction("reviews");
        const reviewsStore = tx.objectStore("reviews");
        return reviewsStore.getAll();
      })
      .then(function(reviews) {
        callback(
          null,
          reviews.filter(review => review.id.toString() === id.toString())
        );
      })
      .catch(function(error) {
        const error = `Request failed. Returned status of ${error}`;
        callback(error, null);
      });
  }

  static syncOfflineReviewsWithServer() {
    const dbPromise = idb.open("restaurants_db");
    dbPromise
      .then(function(db) {
        const tx = db.transaction("offline-reviews");
        const reviewsStore = tx.objectStore("offline-reviews");
        return reviewsStore.getAll();
      })
      .then(function(reviews) {
        // send payload to the server
        reviews.forEach(offlineReview => {
          if (offlineReview.offline) {
            fetch(DBHelper.SaveReviewURL, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
              },
              body: JSON.stringify(offlineReview)
            })
              .then(res => res.json())
              .then(response => {
                dbPromise.then(db => {
                  // delete offline data after sending it to the server
                  let tx = db.transaction("offline-reviews", "readwrite");
                  let reviewsStore = tx.objectStore("offline-reviews");
                  reviewsStore.delete(offlineReview.createdAt);
                  tx.complete;
                  tx = db.transaction("reviews", "readwrite");
                  reviewsStore = tx.objectStore("reviews");
                  reviewsStore.put(response);
                  return tx.complete;
                });
              }) // Got a successfully response from the server
              .catch(errorMessage => {
                const error = `Request failed. Returned status of ${errorMessage}`;
                console.log(errorMessage);
              });
          }
        });
      });
  }
}