$(async function() {
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
	const $profileName = $('#profile-name');
	const $profileUsername = $('#profile-username');
	const $profileAccountDate = $('#profile-account-date');
	const $userProfile = $('#user-profile');

	let storyList = null;

	let currentUser = null;

	await checkIfLoggedIn();

	$loginForm.on('submit', async function(evt) {
		evt.preventDefault();
		const username = $('#login-username').val();
		const password = $('#login-password').val();
		const userInstance = await User.login(username, password);
		currentUser = userInstance;
		syncCurrentUserToLocalStorage();
		loginAndSubmitForm();
	});

	$createAccountForm.on('submit', async function(evt) {
		evt.preventDefault();
		let name = $('#create-account-name').val();
		let username = $('#create-account-username').val();
		let password = $('#create-account-password').val();
		const newUser = await User.create(username, password, name);
		currentUser = newUser;
		syncCurrentUserToLocalStorage();
		loginAndSubmitForm();
	});

	$navLogOut.on('click', function() {
		localStorage.clear();
		location.reload();
	});

	$navLogin.on('click', function() {
		$loginForm.slideToggle();
		$createAccountForm.slideToggle();
		$allStoriesList.toggle();
	});

	$('body').on('click', '#nav-all', async function() {
		hideElements();
		await generateStories();
		$allStoriesList.slideDown('fast', function() {});
	});

	async function checkIfLoggedIn() {
		const token = localStorage.getItem('token');
		const username = localStorage.getItem('username');
		currentUser = await User.getLoggedInUser(token, username);
		await generateStories();

		if (currentUser) {
			showNavForLoggedInUser();
		}
	}

	function loginAndSubmitForm() {
		$loginForm.hide();
		$createAccountForm.hide();
		$loginForm.trigger('reset');
		$createAccountForm.trigger('reset');
		generateStories();
		$allStoriesList.show();
		showNavForLoggedInUser();
	}

	async function generateStories() {
		const storyListInstance = await StoryList.getStories();
		storyList = storyListInstance;
		$allStoriesList.empty();
		for (let story of storyList.stories) {
			const result = generateStoryHTML(story);
			$allStoriesList.append(result);
		}
	}

	function generateStoryHTML(story) {
		let hostName = getHostName(story.url);
		let starType;
		let addTrashcan;
		if (currentUser === null) {
			starType = 'far';
		} else {
			starType = isType(currentUser.favorites, story.storyId) ? 'fas' : 'far';
			if (isType(currentUser.ownStories, story.storyId)) {
				addTrashcan = 'fa fa-trash';
			}
		}
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

	function hideElements() {
		const elementsArr = [
			$submitForm,
			$allStoriesList,
			$filteredArticles,
			$ownStories,
			$loginForm,
			$createAccountForm,
			$favoritesList,
			$userProfile
		];
		elementsArr.forEach(($elem) => $elem.hide());
	}

	function showNavForLoggedInUser() {
		$navLogin.hide();
		$navUserProfile.text(currentUser.username);
		$navUserProfile.show();
		$navLogOut.show();
	}

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

	function syncCurrentUserToLocalStorage() {
		if (currentUser) {
			localStorage.setItem('token', currentUser.loginToken);
			localStorage.setItem('username', currentUser.username);
		}
	}

	$('body').on('click', '#nav-welcome', function(e) {
		hideElements();
		$userProfile.slideDown('fast', function() {});
		$profileName.text(`Name: ${currentUser.name}`);
		$profileUsername.text(`Username: ${currentUser.username}`);
		$profileAccountDate.text(`Account Created: ${currentUser.createdAt}`);
	});

	$('body').on('click', '#change-name-button', async function(e) {
		const newNameInput = $('#change-name').val();
		const tester = await currentUser.changeName(newNameInput);
		await currentUser.retrieveDetails();
		$profileName.text(`Name: ${currentUser.name}`);
		$('#change-name').val('');
		const addSuccessTarget = e.target.parentElement;
		console.log(addSuccessTarget);
		const addSuccess = document.createElement('span');
		addSuccess.setAttribute('id', 'temp-success-msg');
		addSuccess.setAttribute('display', 'inline-block');
		addSuccess.innerText = 'Name Changed Successfully';
		addSuccessTarget.appendChild(addSuccess);
		const $success = $('#temp-success-msg');
		$success.fadeOut(3000, 'swing', removeSuccess);
	});

	$('body').on('click', '#change-pass-button', async function(e) {
		console.log('clicked!');
		let newPass = $('#new-pass').val();
		let repeatPass = $('#repeat-pass').val();
		if (newPass === repeatPass) {
			await currentUser.retrieveDetails();
			$('#new-pass').val('');
			$('#repeat-pass').val('');
			const addSuccessTarget = e.target.parentElement;
			const addSuccess = document.createElement('span');
			addSuccess.setAttribute('id', 'temp-success-msg');
			addSuccess.innerText = 'Password Changed Successfully';
			addSuccessTarget.appendChild(addSuccess);
			const $success = $('#temp-success-msg');
			$success.fadeOut(3000, 'swing', removeSuccess);
		} else {
			alert('Passwords Do Not Match!');
		}
	});

	function removeSuccess() {
		const findSuccessMsg = document.getElementById('temp-success-msg');
		findSuccessMsg.remove();
	}

	$('body').on('click', '#nav-submit', function() {
		hideElements();
		$submitForm.slideDown('fast', function() {});
	});

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

	$('body').on('click', '#nav-my-stories', function() {
		$ownStories.empty();
		hideElements();
		generateMyStoriesList();
		$ownStories.slideDown('fast', function() {});
	});

	//
	async function generateMyStoriesList() {
		const storyListInstance = await StoryList.getStories();
		storyList = storyListInstance;
		$allStoriesList.empty();
		for (let story of storyList.stories) {
			if (isType(currentUser.ownStories, story.storyId)) {
				const result = generateStoryHTML(story);
				$ownStories.append(result);
			}
		}
		await currentUser.retrieveDetails();
	}

	$('body').on('click', '#nav-favorites', function() {
		$favoritesList.empty();
		hideElements();
		generateFavoritesList();
		$favoritesList.slideDown('fast', function() {});
	});

	async function generateFavoritesList() {
		const storyListInstance = await StoryList.getStories();
		storyList = storyListInstance;
		$allStoriesList.empty();
		for (let story of storyList.stories) {
			if (isType(currentUser.favorites, story.storyId)) {
				const result = generateStoryHTML(story);
				$favoritesList.append(result);
			} else {
			}
		}
	}

	$('.articles-container').on('click', '.star', async function(e) {
		e.preventDefault();
		const evtTarget = e.target;
		const storyId = evtTarget.parentElement.parentElement.id;
		if (evtTarget.classList.contains('far')) {
			evtTarget.classList.remove('far');
			evtTarget.classList.add('fas');
			await currentUser.addFavorite(storyId);
		} else if (evtTarget.classList.contains('fas')) {
			evtTarget.classList.remove('fas');
			evtTarget.classList.add('far');
			await currentUser.removeFavorite(storyId);
		}
	});

	$('.articles-container').on('click', '.trash-can', async function(e) {
		e.preventDefault();
		const evtTarget = e.target;
		const storyId = evtTarget.parentElement.parentElement.id;
		const confirmButton = confirm('Would you like to delete your story?');
		if (confirmButton === true) {
			await currentUser.removeMyStory(storyId);
		}
		await currentUser.retrieveDetails();
		await generateStories();
		if (e.target.parentElement.parentElement.parentElement.id === 'my-articles') {
			$ownStories.empty();
			generateMyStoriesList();
		}
	});
});
