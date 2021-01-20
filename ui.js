$(async function() {
	// cache some selectors we'll be using quite a bit
	const $allStoriesList = $('#all-articles-list');
	const $submitForm = $('#submit-form');
	const $filteredArticles = $('#filtered-articles');
	const $loginForm = $('#login-form');
	const $createAccountForm = $('#create-account-form');
	const $ownStories = $('#my-articles');
	const $navLogin = $('#nav-login');
	const $navLogOut = $('#nav-logout');
	const $navUserProfile = $('#nav-welcome');
	const $favoritesList = $('#favorited-articles');

	// global storyList variable
	let storyList = null;

	// global currentUser variable
	let currentUser = null;

	await checkIfLoggedIn();

	/**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

	$loginForm.on('submit', async function(evt) {
		evt.preventDefault(); // no page-refresh on submit

		// grab the username and password
		const username = $('#login-username').val();
		const password = $('#login-password').val();

		// call the login static method to build a user instance
		const userInstance = await User.login(username, password);
		// set the global user to the user instance
		currentUser = userInstance;
		syncCurrentUserToLocalStorage();
		loginAndSubmitForm();
	});

	/**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

	$createAccountForm.on('submit', async function(evt) {
		evt.preventDefault(); // no page refresh

		// grab the required fields
		let name = $('#create-account-name').val();
		let username = $('#create-account-username').val();
		let password = $('#create-account-password').val();

		// call the create method, which calls the API and then builds a new user instance
		const newUser = await User.create(username, password, name);
		currentUser = newUser;
		syncCurrentUserToLocalStorage();
		loginAndSubmitForm();
	});

	/**
   * Log Out Functionality
   */

	$navLogOut.on('click', function() {
		// empty out local storage
		localStorage.clear();
		// refresh the page, clearing memory
		location.reload();
	});

	/**
   * Event Handler for Clicking Login
   */

	$navLogin.on('click', function() {
		// Show the Login and Create Account Forms
		$loginForm.slideToggle();
		$createAccountForm.slideToggle();
		$allStoriesList.toggle();
	});

	/**
   * Event handler for Navigation to Homepage
   */

	$('body').on('click', '#nav-all', async function() {
		hideElements();
		await generateStories();
		$allStoriesList.show();
	});

	/**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

	async function checkIfLoggedIn() {
		// let's see if we're logged in
		const token = localStorage.getItem('token');
		const username = localStorage.getItem('username');

		// if there is a token in localStorage, call User.getLoggedInUser
		//  to get an instance of User with the right details
		//  this is designed to run once, on page load
		currentUser = await User.getLoggedInUser(token, username);
		await generateStories();

		if (currentUser) {
			showNavForLoggedInUser();
		}
	}

	/**
   * A rendering function to run to reset the forms and hide the login info
   */

	function loginAndSubmitForm() {
		// hide the forms for logging in and signing up
		$loginForm.hide();
		$createAccountForm.hide();

		// reset those forms
		$loginForm.trigger('reset');
		$createAccountForm.trigger('reset');

		//HAD TO ADD THIS IN SO THAT FAVORITES WOULD BE MARKED ON ALLSTORIESLIST UPON LOGIN
		generateStories();
		// show the stories
		$allStoriesList.show();

		// update the navigation bar
		showNavForLoggedInUser();
	}

	/**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

	async function generateStories() {
		// get an instance of StoryList
		const storyListInstance = await StoryList.getStories();
		// update our global variable
		storyList = storyListInstance;
		// empty out that part of the page
		$allStoriesList.empty();
		// loop through all of our stories and generate HTML for them
		for (let story of storyList.stories) {
			const result = generateStoryHTML(story);
			$allStoriesList.append(result);
		}
	}

	/**
   * A function to render HTML for an individual Story instance
   */

	function generateStoryHTML(story) {
		let hostName = getHostName(story.url);
		let starType;
		if (currentUser === null) {
			starType = 'far';
		} else {
			starType = isType(currentUser.favorites, story.storyId) ? 'fas' : 'far';
		}

		let addTrashcan = '';
		if (isType(currentUser.ownStories, story.storyId)) {
			addTrashcan = 'fa fa-trash';
		}
		// render story markup
		const storyMarkup = $(`
	  <li id="${story.storyId}">
		<span class="star">
			<i class="${starType} fa-star"></i>
		</span>
		<span class="trash-can">
			<i class="${addTrashcan}"></i>
		</span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

		return storyMarkup;
	}

	function isType(arr, val) {
		return arr.some(function(arrVal) {
			return val === arrVal.storyId;
		});
	}
	/* hide all elements in elementsArr */

	function hideElements() {
		const elementsArr = [
			$submitForm,
			$allStoriesList,
			$filteredArticles,
			$ownStories,
			$loginForm,
			$createAccountForm,
			$favoritesList
		];
		elementsArr.forEach(($elem) => $elem.hide());
	}

	function showNavForLoggedInUser() {
		$navLogin.hide();
		$navUserProfile.text(currentUser.username);
		$navUserProfile.show();
		$navLogOut.show();
	}

	/* simple function to pull the hostname from a URL */

	function getHostName(url) {
		let hostName;
		if (url.indexOf('://') > -1) {
			hostName = url.split('/')[2];
		} else {
			hostName = url.split('/')[0];
		}
		if (hostName.slice(0, 4) === 'www.') {
			hostName = hostName.slice(4);
		}
		return hostName;
	}

	/* sync current user information to localStorage */

	function syncCurrentUserToLocalStorage() {
		if (currentUser) {
			localStorage.setItem('token', currentUser.loginToken);
			localStorage.setItem('username', currentUser.username);
		}
	}

	//event handler for submit tab
	$('body').on('click', '#nav-submit', function() {
		$submitForm.show();
	});

	//event handler for submitting article
	$('body').on('submit', '#submit-form', async function(event) {
		event.preventDefault();
		const username = currentUser.username;
		const gatherInfo = {
			author: $submitForm[0][0].value,
			title: $submitForm[0][1].value,
			url: $submitForm[0][2].value,
			username
		};
		const storyObject = await storyList.addStory(currentUser, gatherInfo);
		console.log(storyObject.data.story.storyId);
		hideElements();
		await currentUser.retrieveDetails();
		await generateStories();
		$allStoriesList.show();
	});

	//event handler for my stories tab
	$('body').on('click', '#nav-my-stories', function() {
		$ownStories.empty();
		hideElements();
		generateMyStoriesList();
		$ownStories.show();
	});

	//
	async function generateMyStoriesList() {
		// get an instance of StoryList
		const storyListInstance = await StoryList.getStories();
		// update our global variable
		storyList = storyListInstance;

		// empty out that part of the page
		$allStoriesList.empty();
		// loop through all of our stories and generate HTML for them
		for (let story of storyList.stories) {
			if (isType(currentUser.ownStories, story.storyId)) {
				const result = generateStoryHTML(story);
				$ownStories.append(result);
			}
		}
		//retrieve new details
		await currentUser.retrieveDetails();
	}

	//event handler for favorites tab
	$('body').on('click', '#nav-favorites', function() {
		$favoritesList.empty();
		hideElements();
		generateFavoritesList();
		$favoritesList.show();
	});

	async function generateFavoritesList() {
		// get an instance of StoryList
		const storyListInstance = await StoryList.getStories();
		// update our global variable
		storyList = storyListInstance;
		// empty out that part of the page
		$allStoriesList.empty();
		// loop through all of our stories and generate HTML for them
		for (let story of storyList.stories) {
			if (isType(currentUser.favorites, story.storyId)) {
				const result = generateStoryHTML(story);
				$favoritesList.append(result);
			} else {
			}
		}
	}

	//to star favorite articles
	$('.articles-container').on('click', '.star', async function(e) {
		e.preventDefault();
		const evtTarget = e.target;
		const storyId = evtTarget.parentElement.parentElement.id;
		//add some logic to determine if the favorite star is already selected and then change the star as needed and then use one of two functions that i will create outside of this event listener, addFavorite or removeFavorite, using storyID, which I should also create so it retreives the ID from the story.
		if (evtTarget.classList.contains('far')) {
			evtTarget.classList.remove('far');
			evtTarget.classList.add('fas');
			//either create a new function or try to add to syncCurrentUserToLocalStorage
			await currentUser.addFavorite(storyId);
			//make a post request to add to favorites
		} else if (evtTarget.classList.contains('fas')) {
			evtTarget.classList.remove('fas');
			evtTarget.classList.add('far');
			await currentUser.removeFavorite(storyId);
		}
	});
	//to delete my stories
	$('.articles-container').on('click', '.trash-can', async function(e) {
		e.preventDefault();
		const evtTarget = e.target;
		const storyId = evtTarget.parentElement.parentElement.id;
		const confirmButton = confirm('Would you like to delete your story?');
		if (confirmButton === true) {
			await currentUser.removeMyStory(storyId);
		}
		//retrieve new details
		await currentUser.retrieveDetails();
		await generateStories();
		if (e.target.parentElement.parentElement.parentElement.id === 'my-articles') {
			$ownStories.empty();
			generateMyStoriesList();
		}
	});
});
