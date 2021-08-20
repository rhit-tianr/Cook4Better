var rhit = rhit || {};

rhit.FB_COLLECTION_RECIPES = "Recipes";
rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_KEY_CONTENT = "content";
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_LINK = "videolink"
rhit.FB_KEY_PARENT = "parentRecipe";
// rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_USERNAME = "displayName";
rhit.FB_KEY_UID = "uid";
rhit.RecipesManager = null;
rhit.UserManager = null;
rhit.SingleUserManager = null;
rhit.SingleRecipeManager = null;
rhit.fbAuthManager = null;
rhit.word = null;

// from: https://stackoverflow.com/questions/3103962/converting-html-string-into-dom-elements
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
};

function compare(string1, string2) {
	let regexa = new RegExp(string1+'+');
	return regexa.test(string2);
}

// function getDisplayNameById(uid){
// 	firebase.firestore().collection('Users').doc(uid).get().then((doc) => {
// 		if (doc.exists) {
// 			const name = JSON.stringify(doc.data().displayName);
// 			return name;
// 		} else {
// 			console.log("No such document!");
// 		}
// 	}).catch((error) => {
// 		console.log("Error getting document:", error);
// 	});
// }


rhit.Recipe = class {
	constructor(id, content, title, link, parent, time, uid) { //author
		this.id = id;
		this.content = content;
		this.title = title;
		this.link = link;
		this.parent = parent;
		this.time = time;
		this.uid = uid;
	}
}

rhit.User = class {
	constructor(id, displayName) {
		this.id = id;
		this.displayName = displayName;
	}
}

rhit.LoginPageController = class {
	constructor() {
		const inputEmailEl = document.querySelector("#loginEmail");
		const inputPasswordEl = document.querySelector("#loginPassword");
		// const inputUserName = document.querySelector("username"); //!!!!!!!!!!!!!!!!!!!!!!!!!!!! change 
		console.log(inputEmailEl);
		console.log(inputPasswordEl);

		document.querySelector("#createAccountButton").onclick = (event) => {
			$("#createAccountModal").on("show.bs.modal", (error) => {
				document.querySelector("#inputName").value = "";
				document.querySelector("#inputEmail").value = inputEmailEl.value;
				document.querySelector("#password").value = "";
				document.querySelector("#confirmPassword").value = "";
			});
			$("#createAccountModal").on("shown.bs.modal", (error) => {
				document.querySelector("#inputName").focus();
			});
			$('#createAccountModal').modal({
				backdrop: 'static',
				keyboard: false
			});
			document.querySelector("#cancelButton").onclick = (event) => {
				$('#createAccountModal').modal('hide');
			};
		};


		document.querySelector("#submitAddAccount").onclick = (event) => {
			const createName = document.querySelector("#inputName").value;
			const createEmail = document.querySelector("#inputEmail").value;
			const createPw = document.querySelector("#password").value;
			const confirmPw = document.querySelector("#confirmPassword").value;
			console.log(`Create account for email: ${createEmail} password: ${createPw} password2: ${confirmPw}`);
			if (createPw == confirmPw) {
				firebase.auth().createUserWithEmailAndPassword(createEmail, createPw).then(cred => {
					return firebase.firestore().collection('Users').doc(cred.user.uid).set({
						[rhit.FB_KEY_USERNAME]: createName
					});
					// rhit.UserManager.add(createName);
				}).then(() => {
					return firebase.auth().currentUser.updateProfile({
						displayName: createName
					})
				}).catch(function (error) {
					var errorCode = error.code;
					var errorMessage = error.message;
					window.alert(errorMessage);
				});
			} else {
				window.alert("Two passwords do not match");
			}
		};

		document.querySelector("#logInButton").onclick = (event) => {
			console.log(`Log in for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
			firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).catch(function (error) {
				var errorCode = error.code;
				var errorMessage = error.message;
				window.alert(errorMessage);
			});
		};
	}
}

rhit.ListPageController = class {
	constructor() {
		document.querySelector("#submitAddRecipe").onclick = (event) => {
			// const author = rhit.UserManager.name;
			const content = document.querySelector("#contentTextarea").value;
			const title = document.querySelector("#inputTitle").value;
			const vlink = document.querySelector("#inputVideoLink").value;
			const parent = "";
			const uid = rhit.fbAuthManager.uid;
			rhit.RecipesManager.add(content, title, vlink, parent, uid); //author
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
			document.querySelector("#inputName").value = rhit.fbAuthManager.name;
		});
		$("#showUserInfoDialog").on("shown.bs.modal", (error) => {
			document.querySelector("#inputName").focus();
		});
		document.querySelector("#menuShowAllRecipes").addEventListener("click", (event) => {
			window.location.href = "/mainpage.html";
		});
		document.querySelector("#menuShowMyRecipes").addEventListener("click", (event) => {
			window.location.href = `/mainpage.html?uid=${rhit.fbAuthManager.uid}`;
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#submitUpdateUser").addEventListener("click", (event) => {
			firebase.auth().currentUser.updateProfile({
				displayName: document.querySelector("#inputName").value
			}).then(() => {
				rhit.SingleUserManager.update(document.querySelector("#inputName").value);
				location.reload();
			}).catch((error) => {
				console.error("Error updating document: ", error);
			});
		});

		document.querySelector("#backbutton").onclick = () => {
			window.location.href = "/mainpage.html";
		};

		document.querySelector("#searchbutton").addEventListener("click", (event) => {
				let searchcontent = document.querySelector("#searchcontent").value;
				window.location.href = `/mainpage.html?search=${searchcontent}`;
				// this.trysearch(searchcontent);
			});
		

		rhit.RecipesManager.beginListening(this.updateList.bind(this));
		// rhit.SingleUserManager.beginListening(this.updateName.bind(this));
	}

	updateList() {
		//make a new recipeListContainer
		const newList = htmlToElement('<div id="recipeListContainer"></div>');
		// fill recipeListContainer with cards using loop
		// for (let i = 0; i < rhit.RecipesManager.length; i++){
		// 	const r = rhit.RecipesManager.getRecipeAtIndex(i);
		// 	const t = r.title;
		// }
		for (let i = 0; i < rhit.RecipesManager.length; i++) {
			const r = rhit.RecipesManager.getRecipeAtIndex(i);
			firebase.firestore().collection('Users').doc(r.uid).get().then((doc) => {
				if (doc.exists) {
					const name = JSON.parse(JSON.stringify(doc.data().displayName));
					const newCard = this._createCard(r, name);
					newCard.onclick = (event) => {
						window.location.href = `/recipedetail.html?id=${r.id}`;
					}
					newList.appendChild(newCard);
				} else {
					console.log("No such document!");
				}
			}).catch((error) => {
				console.log("Error getting document:", error);
			});
		}


		//remove old recipeListContainer
		const oldList = document.querySelector("#recipeListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		//put in new recipeListContainer
		oldList.parentElement.appendChild(newList);
	}

	_createCard(Recipe, displayName) {
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <h5 class="card-title">${Recipe.title}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${displayName}</h6>    
		  <h7 class="card-subtitle mb-2 text-muted">${Recipe.time}</h7>
        </div>
      </div>`);
	}
}


rhit.UserManager = class {
	constructor() {
		this._documentSnapshot = {};
		// this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(uid);
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._unsubscribe = null;
	}
	// add(name) {
	// 	this._ref.add({
	// 		[rhit.FB_KEY_USERNAME]: name
	// 	}).then(function () {
	// 		console.log("Username successfully written!");
	// 	}).catch(function (error) {
	// 		console.error("Error adding document: ", error);
	// 	});
	// }
	// update(name) {
	// 	this._ref.update({
	// 			[rhit.FB_KEY_USERNAME]: name
	// 		})
	// 		.then(function () {
	// 			console.log("update username successfully!");
	// 		})
	// 		.catch(function (error) {
	// 			console.error("Error adding document: ", error);
	// 		});
	// }
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// console.log("No such document!");
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
	get length() {
		return this._documentSnapshots.length;
	}
	getUserAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const r = new rhit.Recipe(docSnapshot.id, docSnapshot.get(rhit.FB_KEY_USERNAME));
		return r;
	}
}

rhit.SingleUserManager = class {
	constructor(uid) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(uid);
		console.log(`Listing to ${this._ref.path}`);
	}
	update(name) {
		this._ref.update({
				[rhit.FB_KEY_USERNAME]: name,
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
	// delete() {
	// 	return this._ref.delete();
	// }
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
			// const author = user.displayName;
			rhit.SingleRecipeManager.update(title, content, vlink); //author
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
		const user = firebase.auth().currentUser;


		document.querySelector("#submitAddRecipe1").onclick = (event) => {
			console.log("I liked the Post and now a new copy shouldve been made");
			// create a new copy of the current post and the author is the current user.
			// const author = rhit.fbAuthManager.;
			const title = document.querySelector("#inputTitle1").value;
			const content = document.querySelector("#contentTextarea1").value;
			const vlink = document.querySelector("#inputVideoLink1").value;
			const urlParams = new URLSearchParams(window.location.search);
			const parent = urlParams.get("id"); // get the id of the current post
			// console.log(author","+content+","+title+","+vlink+","+urlParams+","+parent);
			rhit.RecipesManager.add(content, title, vlink, parent,rhit.fbAuthManager.uid); //author
		};
		$("#addFavoriteDialog").on("show.bs.modal", (error) => {
			document.querySelector("#inputTitle1").value = rhit.SingleRecipeManager.title;
			document.querySelector("#contentTextarea1").value = rhit.SingleRecipeManager.content;
			document.querySelector("#inputVideoLink1").value = rhit.SingleRecipeManager.link;
		});
		$("#addFavoriteDialog").on("shown.bs.modal", (error) => {
			document.querySelector("#inputTitle1").focus();
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			console.log("you clicked signOut");
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#oriB").onclick = (event) => {
			const parent = rhit.SingleRecipeManager.parent;
			if (parent != "") {
				window.location.href = "/recipedetail.html?id=" + rhit.SingleRecipeManager.parent;
			} else {
				window.alert("This is the original recipe!");
			}

		}
		rhit.SingleRecipeManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#detailTitle").innerHTML = rhit.SingleRecipeManager.title;
		document.querySelector("#detailContent").innerHTML = "Notes:" + rhit.SingleRecipeManager.content;
		if (rhit.SingleRecipeManager.link != "") {
			const vurl = new URL(rhit.SingleRecipeManager.link);
			console.log(vurl);
			console.log("https://www.youtube.com/embed/" + getParameterByName("v", vurl.toString()));
			const correctURL = "https://www.youtube.com/embed/" + getParameterByName("v", vurl.toString());
			document.querySelector("iframe").src = correctURL;
			console.log("detailpage updated");
		} else {
			console.log("There are no video link inputed.");
		}
		if (rhit.SingleRecipeManager.uid == rhit.fbAuthManager.uid) {
			document.querySelector("#menuEdit").style.display = "flex";
			document.querySelector("#menuDelete").style.display = "flex";
		}
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

rhit.RecipesManager = class {
	constructor(uid, search) {
		this._search = search;
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_RECIPES);
		this._unsubscribe = null;
	}
	add(content, title, link, parent, uid) { //author
		this._ref.add({
			// [rhit.FB_KEY_AUTHOR]: author,
			[rhit.FB_KEY_CONTENT]: content,
			[rhit.FB_KEY_TITLE]: title,
			[rhit.FB_KEY_LINK]: link,
			[rhit.FB_KEY_PARENT]: parent,
			[rhit.FB_KEY_UID]: uid,
			[rhit.FB_KEY_LAST_TOUCHED]: Date(firebase.firestore.Timestamp.now()),
		}).then(function () {
			console.log("Document successfully written!");
		}).catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}
	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(100);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_UID, "==", this._uid);
		}
		// if(this.search){
		// 	console.log("searching for: "+ this.search);
		// 	query = this._ref.orderBy(rhit.FB_KEY_TITLE, "desc").where(rhit.FB_KEY_TITLE, ">=", this.search);
				
		// }
		let titleQuery = this._ref.orderBy(rhit.FB_KEY_TITLE, "desc").limit(100);
		if(this._search){
			query = this._ref.where(rhit.FB_KEY_TITLE, "==", this._search);
			// console.log(this._search);
			// rhit.word = this._search;
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
		// this._unsubscribe = titleQuery.onSnapshot((querySnapshot) => {
		// 	this._documentSnapshots = querySnapshot.docs;
		// 	changeListener();
		// });
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
			docSnapshot.get(rhit.FB_KEY_LAST_TOUCHED),
			docSnapshot.get(rhit.FB_KEY_UID)); // author if needed
		return r;
	}
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
	update(title, content, vlink) { //author
		this._ref.update({
				[rhit.FB_KEY_CONTENT]: content,
				[rhit.FB_KEY_TITLE]: title,
				[rhit.FB_KEY_LINK]: vlink,
				[rhit.FB_KEY_LAST_TOUCHED]: Date(firebase.firestore.Timestamp.now()),
				// [rhit.FB_KEY_AUTHOR]: author
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
	// get author() {
	// 	return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	// }
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
	get uid() {
		return this._documentSnapshot.get(rhit.FB_KEY_UID);
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
	get name() {
		return this._user.displayName;
	}
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page");
		new rhit.LoginPageController();
	}
	if (document.querySelector("#MainPage")) {
		console.log("You are on the main page");
		rhit.SingleUserManager = new rhit.SingleUserManager(rhit.fbAuthManager.uid);
		const uid = urlParams.get("uid");
		const search = urlParams.get("search");
		rhit.RecipesManager = new rhit.RecipesManager(uid, search);
		new rhit.ListPageController();
	}

	if (document.querySelector("#detailPage")) {
		console.log("You are on the detailed page");
		const uid = rhit.fbAuthManager.uid;
		rhit.RecipesManager = new rhit.RecipesManager(uid, null);
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
		setTimeout(function () {
			window.location.href = "/mainpage.html";
		}, 1000);
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
			const email = user.email;
			const uid = user.uid;

			console.log("The user is signed in ", uid);
			console.log('displayName :>> ', displayName);
			console.log('email :>> ', email);
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