/////////////////////////////////////////////////
//                                             //
//    Project CHEWSY                           //
//    Flying Orange Team at GA, New York       //
//    February, 2018                           //
//                                             //
//    Instructors:                             //
//        Tims Gardner                         //
//        Drake Tally                          //
//        Dominic Farquharson                  //
//                                             //
/////////////////////////////////////////////////
//                                             //
// This file is from models forlder...         //
//                                             //
/////////////////////////////////////////////////
// Anatoliy added recipesModel.create... 022018//
/////////////////////////////////////////////////

const db = require('../db/index.js');
const axios = require('axios');
const dotenv = require('dotenv').config();

// get app id and key from dotenv file
const app_id = process.env.APP_ID;
const app_key = process.env.APP_KEY;

// specify how many hits we want per page
const HIT_COUNT = 32;

const recipesModel = {};

// helper method for generating url string to be used in axios call
const generateUrl = (query, healthArr) => {
	const q = query; // URL encode query string
	if (healthArr === null) {
		// no optional health labels
		return `https://api.edamam.com/search?app_id=${app_id}&app_key=${app_key}&q=${q}&to=${HIT_COUNT}`;
	} else {
		// url encode health labels
		const health = healthArr.reduce((acc, curr) => {
			return acc.concat('&health=', curr);
		}, '');
		return `https://api.edamam.com/search?app_id=${app_id}&app_key=${app_key}&q=${q}${health}&to=${HIT_COUNT}`;
	}
};

// middleware that takes in user search form inputs and makes axios request to retrieve 10 recipes
recipesModel.getRecipes = (req, res, next) => {
	console.log('in recipesModel.getRecipes!');
	console.log('req.body', req.body);
	const q = req.body.q;
	const health = req.body.health || null;
	const url = generateUrl(q, health);
	console.log('q:', q);
	console.log('health:', health);
	console.log('url:', url);

	axios
		.get(url)
		.then(response => {
			res.locals.recipesData = response.data;
			console.log('axios call success! response data:', response.data);
			next();
		})
		.catch(error => {
			console.log('error making axios call in recipesModel.getRecipes. error:', error);
			next(error);
		});
};

// middleware that looks up detailed recipe information
recipesModel.getMoreInfo = (req, res, next) => {

	console.log('in recipesModel.getMoreInfo!');
	console.log('req.body:', JSON.stringify(req.body));
	const r = req.body.uri.replace('owl#r', 'owl%23r');
	console.log('This is r: ', r);
	const url = `https://api.edamam.com/search?app_id=${app_id}&app_key=${app_key}&r=${r}`;
	// const url = req.body.url;
	console.log('url:', url);


	axios
		.get(url)
		.then(response => {
			res.locals.moreInfoData = response.data;
			console.log('axios call success! response data:', JSON.stringify(response.data));
			next();
		})
		.catch(error => {
			console.log('error making axios call in recipesModel.getRecipes. error:', error);
			next(error);
		});

};

// middleware for populating DB "recipes_user" table with chosen recipes...

recipesModel.create = (req, res, next) => {

  db
    .one(
      'INSERT INTO recipes_user ( user_id, recipe_uri, recipe_url, recipe_img_url, recipe_label, recipe_hlth_lbl, recipe_comment, recipe_rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;',
      [
        req.body.user_id,
        req.body.recipe_uri,
        req.body.recipe_url,
        req.body.recipe_img_url,
        req.body.recipe_label,
        req.body.recipe_hlth_lbl,
        req.body.recipe_comment,
        req.body.recipe_rating
      ]
    )
    .then(recipeId => {
      res.locals.newRecipeId = recipeId;

      console.log(res.locals.newRecipeId);

      next();
    })
    .catch(error => {
      console.log('Error: in recipes.create. Details: ', error);
      next(error);
    });
};

module.exports = recipesModel;
