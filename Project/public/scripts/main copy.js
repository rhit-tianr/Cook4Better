var rhit = rhit || {};

rhit.FB_COLLECTION_RECIPES = "Recipes";
rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_KEY_CONTENT = "content";
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_LINK = "videolink"
rhit.FB_KEY_PARENT = "parentRecipe";
rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_USERNAME = "DisplayName";
rhit.RecipesManager = null;
rhit.SingleRecipeManager = null;
rhit.fbAuthManager = null;

// from: https://stackoverflow.com/questions/3103962/converting-html-string-into-dom-elements
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
};

rhit.Recipe = class {
	constructor(id, content, title, link, parent, author, time) {
		this.id = id;
		this.content = content;
		this.title = title;
		this.link = link;
		this.parent = parent;
		this.author = author;
		this.time = time;
	}
}


rhit.LoginPageController = class {
	constructor() {
		// const createNewUser = functions.auth.user().onCreate((user) => {
		// 	console.log("Created new User");
		// });
		// createNewUser();
		// exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
		// 	// [END onCreateTrigger]
		// 	  // [START eventAttributes]
		// 	  const email = user.email; // The email of the user.
		// 	  const displayName = user.displayName; // The display name of the user.
		// 	  // [END eventAttributes]
		// 	  return sendWelcomeEmail(email, displayName);
		// });
		// async function sendWelcomeEmail(email, displayName) {
		// 	const mailOptions = {
		// 	  from: `Cook4Better <noreply@firebase.com>`,
		// 	  to: email,
		// 	};
		// }
	}
}

rhit.ListPageController = class {
	constructor() {
		const user = firebase.auth().currentUser;
		document.querySelector("#submitAddRecipe").onclick = (event) => {
			const author = user.displayName;
			const content = document.querySelector("#contentTextarea").value;
			const title = document.querySelector("#inputTitle").value;
			const vlink = document.querySelector("#inputVideoLink").value;
			const parent = "";
			rhit.RecipesManager.add(content, title, vlink, parent, author);
		}
		$("#addRecipeDialog").on("show.bs.modal", (error) => {
			document.querySelector("#contentTextarea").value = "";
			document.querySelector("#inputTitle").value = "";
			document.querySelector("#inputVideoLink").value = "";
		});
		$("#addRecipeDialog").on("shown.bs.modal", (error) => {
			document.querySelector("#inputTitle").focus();
		});
		$("#showUserInfoDialog").on("show.bs.modal", (error) => {
			document.querySelector("#inputName").value = user.displayName;
			// document.querySelector("#inputPhone").value = user.phoneNumber;
			// document.querySelector("#inputEmail").value = user.email;
		});
		$("#showUserInfoDialog").on("shown.bs.modal", (error) => {
			document.querySelector("#inputName").focus();
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#submitUpdateUser").addEventListener("click", (event) => {
			user.updateProfile({
				displayName: document.querySelector("#inputName").value,
				// phoneNumber: document.querySelector("#inputPhone").value,
				// email: document.querySelector("#inputEmail").value
			}).then(() => {
				console.log("User information updated successfully!");
			}).catch((error) => {
				console.error("Error updating document: ", error);
			});
		});
		rhit.RecipesManager.beginListening(this.updateList.bind(this));
	}

	updateList() {
		//make a new recipeListContainer
		const newList = htmlToElement('<div id="recipeListContainer"></div>');
		// fill recipeListContainer with cards using loop
		for (let i = 0; i < rhit.RecipesManager.length; i++) {
			const r = rhit.RecipesManager.getRecipeAtIndex(i);
			const newCard = this._createCard(r);
			newCard.onclick = (event) => {
				window.location.href = `/recipedetail.html?id=${r.id}`;
			}
			newList.appendChild(newCard);
		}
		//remove old recipeListContainer
		const oldList = document.querySelector("#recipeListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		//put in new recipeListContainer
		oldList.parentElement.appendChild(newList);
	}

	_createCard(Recipe) {
		console.log(`${Recipe}`);
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <h5 class="card-title">${Recipe.title}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${Recipe.author}</h6>
		  <h7 class="card-subtitle mb-2 text-muted">${Recipe.time}</h7>
        </div>
      </div>`);
	}
}

rhit.RecipesManager = class {
	constructor() {
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_RECIPES);
		this._unsubscribe = null;
	}
	add(content, title, link, parent, author) {
		this._ref.add({
			[rhit.FB_KEY_AUTHOR]: author,
			[rhit.FB_KEY_CONTENT]: content,
			[rhit.FB_KEY_TITLE]: title,
			[rhit.FB_KEY_LINK]: link,
			[rhit.FB_KEY_PARENT]: parent,
			[rhit.FB_KEY_LAST_TOUCHED]: Date(firebase.firestore.Timestamp.now()),
		}).then(function () {
			console.log("Document successfully written!");
		}).catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}
	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	}
	getRecipeAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const r = new rhit.Recipe(docSnapshot.id, docSnapshot.get(rhit.FB_KEY_CONTENT),
			docSnapshot.get(rhit.FB_KEY_TITLE),
			docSnapshot.get(rhit.FB_KEY_LINK),
			docSnapshot.get(rhit.FB_KEY_PARENT),
			docSnapshot.get(rhit.FB_KEY_AUTHOR),
			docSnapshot.get(rhit.FB_KEY_LAST_TOUCHED));
		return r;
	}
}

rhit.UserManager = class{
	constructor() {
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._unsubscribe = null;
	}
	add(name) {
		this._ref.add({
			[rhit.FB_KEY_USERNAME]: name
		}).then(function () {
			console.log("Username successfully written!");
		}).catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}
	update(name){
		this._ref.update({
			[rhit.FB_KEY_USERNAME]: name
		})
		.then(function () {
			console.log("update username successfully!");
		})
		.catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		})
	}
	stopListening() {
		this._unsubscribe();
	}
	delete() {
		return this._ref.delete();
	}
	get name() {
		return this._documentSnapshot.get(rhit.FB_KEY_USERNAME);
	}
}


rhit.DetailPageController = class {
	constructor() {
		document.querySelector("#submitEditRecipe").onclick = (event) => {
			console.log("edit clicked");
			const user = firebase.auth().currentUser;
			const title = document.querySelector("#inputTitle").value;
			const content = document.querySelector("#contentTextarea").value;
			const vlink = document.querySelector("#inputVideoLink").value;
			const author = user.displayName;
			rhit.SingleRecipeManager.update(title, content, vlink, author);
		}
		$("#editRecipeDialog").on("show.bs.modal", (error) => {
			document.querySelector("#inputTitle").value = rhit.SingleRecipeManager.title;
			document.querySelector("#contentTextarea").value = rhit.SingleRecipeManager.content;
			document.querySelector("#inputVideoLink").value = rhit.SingleRecipeManager.link;
		});
		$("#editRecipeDialog").on("shown.bs.modal", (error) => {
			document.querySelector("#inputTitle").focus();
		});
		document.querySelector("#submitDeleteRecipe").addEventListener("click", (event) => {
			rhit.SingleRecipeManager.delete().then(function () {
				console.log("Document successfully deleted");
				window.location.href = '/mainpage.html';
			}).catch(function (error) {
				console.log("Error:", error);
			});
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			console.log("you clicked signOut");
			rhit.fbAuthManager.signOut();
		});
		rhit.SingleRecipeManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#detailTitle").innerHTML = rhit.SingleRecipeManager.title;
		document.querySelector("p").innerHTML = "Notes: " + rhit.SingleRecipeManager.content;
		const vurl = new URL(rhit.SingleRecipeManager.link);
		console.log(vurl);
		console.log("https://www.youtube.com/embed/" + getParameterByName("v", vurl.toString()));
		const correctURL = "https://www.youtube.com/embed/" + getParameterByName("v", vurl.toString());
		document.querySelector("iframe").src = correctURL;
		console.log("detailpage updated");
		// if (rhit.SingleRecipeManager.author == rhit.fbAuthManager.uid) {
		// 	document.querySelector("#menuEdit").style.display = "flex";
		// 	document.querySelector("#menuDelete").style.display = "flex";
		// }
	}
}

// from: https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

rhit.SingleRecipeManager = class {
	constructor(rid) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_RECIPES).doc(rid);
		console.log(`Listing to ${this._ref.path}`);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		})
	}
	stopListening() {
		this._unsubscribe();
	}
	update(title, content, vlink, author) { 
		this._ref.update({
				[rhit.FB_KEY_CONTENT]: content,
				[rhit.FB_KEY_TITLE]: title,
				[rhit.FB_KEY_LINK]: vlink,
				[rhit.FB_KEY_LAST_TOUCHED]: Date(firebase.firestore.Timestamp.now()),
				[rhit.FB_KEY_AUTHOR]: author
			})
			.then(function () {
				console.log("update recipe successfully!");
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}
	delete() {
		return this._ref.delete();
	}
	get author() {
		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	}
	get content() {
		return this._documentSnapshot.get(rhit.FB_KEY_CONTENT);
	}
	get title() {
		return this._documentSnapshot.get(rhit.FB_KEY_TITLE);
	}
	get link() {
		return this._documentSnapshot.get(rhit.FB_KEY_LINK);
	}
	get parent() {
		return this._documentSnapshot.get(rhit.FB_KEY_PARENT);
	}
}


rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		console.log("you have made the Auth manager");
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page");
		var uiConfig = {
			signInSuccessUrl: '/',
			signInOptions: [
				firebase.auth.GoogleAuthProvider.PROVIDER_ID,
				firebase.auth.EmailAuthProvider.PROVIDER_ID,
				firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			],
		};
		var ui = new firebaseui.auth.AuthUI(firebase.auth());
		ui.start('#firebaseui-auth-container', uiConfig);
		// ui.start('#firebaseui-auth-container', uiConfig, {
		// 	signInOptions: [
		// 	  {provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
		// 	  requireDisplayName: true}
		// 	]
		//   });
		
		new rhit.LoginPageController();
	}
	if (document.querySelector("#MainPage")) {
		console.log("You are on the main page");
		rhit.RecipesManager = new rhit.RecipesManager();
		new rhit.ListPageController();
	}
	if (document.querySelector("#detailPage")) {
		console.log("You are on the detailed page");
		const RecipeId = urlParams.get("id");
		if (!RecipeId) {
			window.location.href = "/";
		}
		rhit.SingleRecipeManager = new rhit.SingleRecipeManager(RecipeId);
		new rhit.DetailPageController();
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/mainpage.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	firebase.auth().onAuthStateChanged(function (user) {
		if (user) {
			const displayName = user.displayName;
			const phoneNumber = user.phoneNumber;
			const email = user.email;
			const uid = user.uid;


			console.log("The user is signed in ", uid);
			console.log('displayName :>> ', displayName);
			console.log('email :>> ', email);
			console.log('phoneNumber :>> ', phoneNumber);
			console.log('uid :>> ', uid);
		} else {
			console.log("There is no user signed in");
		}
	});
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};

rhit.main();