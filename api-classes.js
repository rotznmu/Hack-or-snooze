const BASE_URL = 'https://hack-or-snooze-v3.herokuapp.com';

class StoryList {
	constructor(stories) {
		this.stories = stories;
	}

	static async getStories() {
		const response = await axios.get(`${BASE_URL}/stories?`, {
			params: {
				skip: 0,
				limit: 25
			}
		});
		const stories = response.data.stories.map((story) => new Story(story));
		const storyList = new StoryList(stories);
		return storyList;
	}

	async addStory(user, newStory) {
		const response = await axios({
			method: 'POST',
			url: `${BASE_URL}/stories`,
			data: {
				token: user.loginToken,
				story: newStory
			}
		});
		return response;
	}
}

class User {
	constructor(userObj) {
		this.username = userObj.username;
		this.name = userObj.name;
		this.createdAt = userObj.createdAt;
		this.updatedAt = userObj.updatedAt;

		// these are all set to defaults, not passed in by the constructor
		this.loginToken = '';
		this.favorites = [];
		this.ownStories = [];
	}

	static async create(username, password, name) {
		const response = await axios.post(`${BASE_URL}/signup`, {
			user: {
				username,
				password,
				name
			}
		});

		const newUser = new User(response.data.user);

		newUser.loginToken = response.data.token;

		return newUser;
	}

	static async login(username, password) {
		const response = await axios.post(`${BASE_URL}/login`, {
			user: {
				username,
				password
			}
		});

		const existingUser = new User(response.data.user);

		existingUser.favorites = response.data.user.favorites.map((s) => new Story(s));
		existingUser.ownStories = response.data.user.stories.map((s) => new Story(s));

		existingUser.loginToken = response.data.token;

		return existingUser;
	}

	static async getLoggedInUser(token, username) {
		if (!token || !username) return null;

		const response = await axios.get(`${BASE_URL}/users/${username}`, {
			params: {
				token
			}
		});

		const existingUser = new User(response.data.user);

		existingUser.loginToken = token;

		existingUser.favorites = response.data.user.favorites.map((s) => new Story(s));
		existingUser.ownStories = response.data.user.stories.map((s) => new Story(s));
		return existingUser;
	}

	async retrieveDetails() {
		const response = await axios.get(`${BASE_URL}/users/${this.username}`, {
			params: {
				token: this.loginToken
			}
		});

		this.name = response.data.user.name;
		this.createdAt = response.data.user.createdAt;
		this.updatedAt = response.data.user.updatedAt;

		this.favorites = response.data.user.favorites.map((s) => new Story(s));
		this.ownStories = response.data.user.stories.map((s) => new Story(s));

		return this;
	}

	async changeName(newName) {
		await axios({
			url: `${BASE_URL}/users/${this.username}`,
			method: 'PATCH',
			data: {
				token: this.loginToken,
				user: {
					name: newName
				}
			}
		});
	}

	async changePass(newPass) {
		await axios({
			url: `${BASE_URL}/users/${this.username}`,
			method: 'PATCH',
			data: {
				token: this.loginToken,
				user: {
					password: newPass
				}
			}
		});
	}
	async addFavorite(storyId) {
		await axios({
			url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
			method: 'POST',
			data: {
				token: this.loginToken
			}
		});
		await this.retrieveDetails();
	}
	async removeFavorite(storyId) {
		const response = await axios({
			url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
			method: 'DELETE',
			data: {
				token: this.loginToken
			}
		});
		await this.retrieveDetails();
	}
	async removeMyStory(storyId) {
		const response = await axios({
			url: `${BASE_URL}/stories/${storyId}`,
			method: 'DELETE',
			data: {
				token: this.loginToken
			}
		});
		await this.retrieveDetails();
	}
}

class Story {
	/**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

	constructor(storyObj) {
		this.author = storyObj.author;
		this.title = storyObj.title;
		this.url = storyObj.url;
		this.username = storyObj.username;
		this.storyId = storyObj.storyId;
		this.createdAt = storyObj.createdAt;
		this.updatedAt = storyObj.updatedAt;
	}
}
