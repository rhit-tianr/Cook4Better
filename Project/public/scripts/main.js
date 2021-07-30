/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

rhit.LoginPageController = class{
	constructor() {
		document.querySelector("#loginEB").onclick = (event) => {
			window.location.href = `/mainpage.html`;
			// console.log(`Log in for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
			// firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).catch(function(error){
			// 	var errorCode = error.code;
			// 	var errorMessage = error.message;
			// 	console.log("Existing account log in error", errorCode, errorMessage);
			// });
		};
		//start listening
		rhit.fbMovieQuotesManager.beginListening(this.updateList.bind(this));
	}
	// updateList() {
	// 	console.log("need to update");
	// 	console.log(`Num quotes = ${rhit.fbMovieQuotesManager.length}`);
	// 	console.log(`Example = `, rhit.fbMovieQuotesManager.getMovieQuoteAtIndex(0));

	// 	//make a new quoteListContainer
	// 	const newList = htmlToElement('<div id="quoteListContainer"></div>');
	// 	// fill quoteListContainer with quote cards using loop
	// 	for(let i=0; i<rhit.fbMovieQuotesManager.length; i++){
	// 		const mq = rhit.fbMovieQuotesManager.getMovieQuoteAtIndex(i);
	// 		const newCard = this._createCard(mq);

	// 		newCard.onclick = (event) =>{
	// 			// console.log(`clicked on ${mq.id}`);
	// 			// rhit.storage.setMovieQuoteId(mq.id);
	// 			window.location.href = `/moviequote.html?id=${mq.id}`;
	// 		}
	// 		newList.appendChild(newCard);
	// 	}
	// 	//remove old quoteListContainer
	// 	const oldList = document.querySelector("#quoteListContainer");
	// 	oldList.removeAttribute("id");
	// 	oldList.hidden = true;
	// 	//put in new quoteListContainer
	// 	oldList.parentElement.appendChild(newList);
	// }

	// _createCard(movieQuote){
	// 	return htmlToElement(`      <div class="card">
    //     <div class="card-body">
    //       <h5 class="card-title">${movieQuote.quote}</h5>
    //       <h6 class="card-subtitle mb-2 text-muted">${movieQuote.movie}</h6>
    //     </div>
    //   </div>`)
	// }
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");	 
	
	
};

rhit.main();
