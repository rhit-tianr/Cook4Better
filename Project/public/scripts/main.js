/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

rhit.FB_COLLECTION_RECIPES = "Recipes";
rhit.FB_KEY_CONTENT = "content";
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_LINK = "videolink"
rhit.FB_KEY_PARENT = "parentRecipe";
rhit.FB_KEY_PRIVACY = "isPublic";
rhit.FB_KEY_AUTHOR = "author";
rhit.RecipesManager = null;
rhit.SingleRecipeManager = null;
// rhit.fbAuthManager = null;

// from: https://stackoverflow.com/questions/3103962/converting-html-string-into-dom-elements
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
};

rhit.Recipe = class{
	constructor(id, content, title, link, parent, isPublic){
		this.id = id;
		this.content = content;
		this.title = title;
		this.link = link;
		this.parent = parent;
		this.isPublic = isPublic;
	}
}


rhit.LoginPageController = class{
	constructor() {
		document.querySelector("#loginEB").onclick = (event) => {
			window.location.href = `/mainpage.html`;
		};
	}
}

rhit.ListPageController = class{
	constructor() {
		document.querySelector("#submitAddRecipe").onclick = (event) => {
			const content = document.querySelector("#contentTextarea").value;
			const title = document.querySelector("#inputTitle").value;
			const vlink = document.querySelector("#inputVideoLink").value;
			const ispublic = document.querySelector("#publiccheck").checked;
			// const ispublic = $("#publicCheck").is(":checked");
			console.log(ispublic);
			const parent = "";
			rhit.RecipesManager.add(content, title, vlink, parent, ispublic);
		}
		$("#addRecipeDialog").on("show.bs.modal", (error) => {
			document.querySelector("#contentTextarea").value = "";
			document.querySelector("#inputTitle").value = "";
			document.querySelector("#inputVideoLink").value = "";
			document.querySelector("#publiccheck").checked = true;
		});
		$("#addRecipeDialog").on("shown.bs.modal", (error) => {
			document.querySelector("#inputTitle").focus();
		});
		rhit.RecipesManager.beginListening(this.updateList.bind(this));
	}

	updateList(){
		console.log("need to update");
		console.log(`Num quotes = ${rhit.RecipesManager.length}`);
		console.log(`Example = `, rhit.RecipesManager.getRecipeAtIndex(0));
		//make a new recipeListContainer
		const newList = htmlToElement('<div id="recipeListContainer"></div>');
		// fill recipeListContainer with cards using loop
		for(let i=0; i<rhit.RecipesManager.length; i++){
			const r = rhit.RecipesManager.getRecipeAtIndex(i);
			const newCard = this._createCard(r);
			newCard.onclick = (event) =>{
				console.log(`clicked on ${r.id}`);
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

	_createCard(Recipe){
		console.log(`${Recipe}`);
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <h5 class="card-title">${Recipe.title}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${Recipe.author}</h6>
        </div>
      </div>`);
	}
}

rhit.RecipesManager = class{
	constructor() {
		console.log("created RecipesManager");
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_RECIPES);
		this._unsubscribe = null;
	}
	add(content, title, link, parent, isPublic){
		this._ref.add({
			[rhit.FB_KEY_CONTENT]: content,
			[rhit.FB_KEY_TITLE]: title,
			[rhit.FB_KEY_LINK]: link,
			[rhit.FB_KEY_PARENT]: parent,
			[rhit.FB_KEY_PRIVACY]: isPublic,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		}).then(function(docRef) {
		    console.log("Document written with ID: ", docRef.id);
		}).catch(function(error) {
		    console.error("Error adding document: ", error);
		});
	}
	beginListening(changeListener){
		this._unsubscribe = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50).onSnapshot((querySnapshot) => {
			console.log("Recipes updated");
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});	
	}
	stopListening(){
		this._unsubscribe();
	}
	get length(){
		return this._documentSnapshots.length;
	}
	getRecipeAtIndex(index){
		const docSnapshot = this._documentSnapshots[index];
		const r = new rhit.Recipe(docSnapshot.id, docSnapshot.get(rhit.FB_KEY_CONTENT),
												docSnapshot.get(rhit.FB_KEY_TITLE),
												docSnapshot.get(rhit.FB_KEY_LINK),
												docSnapshot.get(rhit.FB_KEY_PARENT),
												docSnapshot.get(rhit.FB_KEY_PRIVACY));
		return r;
	}
}

rhit.DetailPageController = class{
	constructor() {}
}

rhit.SingleRecipeManager =class{
	constructor(){}
	beginListening(){}
	stopListening(){}
	update(){}
	delete(){
		return this._ref.delete();
	}
	get content(){
		return this._documentSnapshot.get(rhit.FB_KEY_CONTENT);
	}
	get title(){
		return this._documentSnapshot.get(rhit.FB_KEY_TITLE);
	}
	get link(){
		return this._documentSnapshot.get(rhit.FB_KEY_LINK);
	}
	get parent(){
		return this._documentSnapshot.get(rhit.FB_KEY_PARENT);
	}
	get privacy(){
		return this._documentSnapshot.get(rhit.FB_KEY_PRIVACY);
	}
}
/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");	 
	if(document.querySelector("#loginPage")){
		console.log("You are on the login page");
		new rhit.LoginPageController();
	}
	if(document.querySelector("#MainPage")){
		console.log("You are on the main page");
		rhit.RecipesManager = new rhit.RecipesManager();
		new rhit.ListPageController();
	}
};

rhit.main();
