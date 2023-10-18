class t{date=new Date;id=(Date.now()+"").slice(-10);constructor(t,e,o){this.coords=t,this.distance=e,this.duration=o}_setDescription(){this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${["January","February","March","April","May","June","July","August","September","October","November","December"][this.date.getMonth()]} ${this.date.getDate()}`}}class e extends t{type="running";constructor(t,e,o,s){super(t,e,o),this.cadence=s,this.calcPace(),this._setDescription()}calcPace(){return(// min/km
this.pace=this.duration/this.distance,this.pace)}}class o extends t{type="cycling";constructor(t,e,o,s){super(t,e,o),this.elevationGain=s,this.calcSpeed(),this._setDescription()}calcSpeed(){return(// km/h
this.speed=this.distance/(this.duration/60),this.speed)}}///////////////////////////////////////////////
// APPLICATION ARCHITECTURE
const s=document.querySelector(".form"),i=document.querySelector(".workouts"),r=document.querySelector(".form__input--type"),a=document.querySelector(".form__input--distance"),n=document.querySelector(".form__input--duration"),u=document.querySelector(".form__input--cadence"),l=document.querySelector(".form__input--elevation");new class{#t;#e=13;#o;#s=[];#i=[];#r=1;#a=!1;constructor(){// Get user's position
this._getPosition(),// Get data from local storage
// this._getLocalStorage();
// Attach event handler
s.addEventListener("submit",t=>{t.preventDefault(),this.#a?this._updateWorkout():this._newWorkout()}),r.addEventListener("change",this._toggleElevationField),i.addEventListener("click",t=>{this._moveToPopup(t),this._editWorkout(t),this._deleteWorkout(t)})}_getPosition(){navigator.geolocation&&navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){alert("Could not get your position")},{enableHighAcuracy:!0})}_loadMap(t){let{latitude:e}=t.coords,{longitude:o}=t.coords,s=[e,o];this.#t=L.map("map").setView(s,this.#e),L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(this.#t),// handling clicks on map
this.#t.on("click",this._showForm.bind(this)),this.#s.forEach(t=>{this._renderWorkoutMarker(t)})}_showForm(t){this.#o=t,s.classList.remove("hidden"),a.focus()}_hideForm(){// Empty inputs
a.value=n.value=u.value=l.value="",s.style.display="none",s.classList.add("hidden"),setTimeout(()=>s.style.display="grid",1e3)}_toggleElevationField(){l.closest(".form__row").classList.toggle("form__row--hidden"),u.closest(".form__row").classList.toggle("form__row--hidden")}_resetFormFormat(){let t=s.children;r.value="running",t[3].classList.remove("form__row--hidden"),t[4].classList.add("form__row--hidden")}_checkValidInput(...t){let e=t.every(t=>Number.isFinite(t)),o=t.every(t=>t>0);return e||o}_newWorkout(){let t;// Get data from form
let s=r.value,i=+a.value,c=+n.value,d=+u.value,p=+l.value,{lat:h,lng:_}=this.#o.latlng;// If workout running, create running object
if("running"===s){// Check if data is valid
if(!this._checkValidInput(i,c,d))return alert("Inputs have to be positive numbers!");t=new e([h,_],i,c,d)}// If workout cycling, create cycling object
if("cycling"===s){// Check if data is valid
if(!this._checkValidInput(i,c,p))return alert("Inputs have to be positive numbers!");t=new o([h,_],i,c,p)}// Add new object to workout array
this.#s.push(t),// Render workout on map as marker
this._renderWorkoutMarker(t),// Render workout on list
this._renderWorkout(t),// Hide form + Clear input fields
this._hideForm();// Reset form format
// this._resetFormFormat();
// Set local storage to all workouts
// this._setLocalStorage();
}_renderWorkoutMarker(t){let e=L.marker(t.coords);e.addTo(this.#t).bindPopup(L.popup({maxWidth:250,minWidth:100,autoClose:!1,closeOnClick:!1,className:`${t.type}-popup`})).setPopupContent(`${"running"===t.type?"\uD83C\uDFC3‍♂️":"\uD83D\uDEB4‍♀️"} ${t.description}`).openPopup(),this.#i.push(e)}_renderWorkout(t){let e=`
      <li class="workout workout--${t.type}" data-id="${t.id}">
        <div>
          <h2 class="workout__title">${t.description}</h2>
          <button class="workout--btn btn--edit" type="button">Edit</button>
          <button class="workout--btn btn--delete" type="button">Delete</button>
        </div>
        <div class="workout__details">
          <span class="workout__icon">${"running"===t.type?"\uD83C\uDFC3‍♂️":"\uD83D\uDEB4‍♀️"}</span>
          <span class="workout__value">${t.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">\u{23F1}</span>
          <span class="workout__value">${t.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;"running"===t.type&&(e+=`
        <div class="workout__details">
          <span class="workout__icon">\u{26A1}\u{FE0F}</span>
          <span class="workout__value">${t.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">\u{1F9B6}\u{1F3FC}</span>
          <span class="workout__value">${t.cadence.toFixed(1)}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`),"cycling"===t.type&&(e+=`
        <div class="workout__details">
          <span class="workout__icon">\u{26A1}\u{FE0F}</span>
          <span class="workout__value">${t.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">\u{26F0}</span>
          <span class="workout__value">${t.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>`),s.insertAdjacentHTML("afterend",e)}_matchID(t){let e=t.target.closest(".workout");if(!e)return;let o=this.#s.find(t=>t.id===e.dataset.id);return o}_moveToPopup(t){t.target.closest(".workout")&&(this.#r=this._matchID(t),this.#t.setView(this.#r.coords,this.#e,{animate:!0,pan:{duration:1}}))}_editWorkout(t){if(!t.target.classList.contains("btn--edit"))return;this.#a=!0;// Remove target workout element
let e=t.target.closest(".workout");e.remove(),// Fill form with that workout element data
this.#r=this.#s.find(t=>t.id===e.dataset.id),// Show form and fill form
s.classList.remove("hidden"),a.focus(),a.value=this.#r.distance,n.value=this.#r.duration,r.value=this.#r.type,"running"===this.#r.type&&(u.value=this.#r.cadence),"cycling"===this.#r.type&&(l.value=this.#r.elevationGain)}_updateWorkout(){let t=this.#r,s=r.value,i=+a.value,c=+n.value,d=t.coords,p=+u.value,h=+l.value;// Things happen when users choose different type
if(t.type!==s){let r;if("running"===s){if(!this._checkValidInput(i,c,p))return alert("Inputs have to be positive numbers!");r=new e(d,i,c,p)}if("cycling"===s){if(!this._checkValidInput(i,c,h))return alert("Inputs have to be positive numbers!");r=new o(d,i,c,h)}this.#s.splice(this.#s.indexOf(t),1,r),this._renderWorkout(r),// Remove previous marker from map (execute first) and then, from #markersArr.
this.#i[this.#s.indexOf(r)].remove(),this.#i.splice(this.#s.indexOf(r),1),// After that, add new marker.
this._renderWorkoutMarker(r)}// Things happen when users keep the same type
if(t.type===s){if("running"===t.type){if(!this._checkValidInput(i,c,p))return alert("Inputs have to be positive numbers!");t.distance=i,t.duration=c,t.cadence=p,t.calcPace(),this._renderWorkout(t)}if("cycling"===t.type){if(!this._checkValidInput(i,c,h))return alert("Inputs have to be positive numbers!");t.distance=i,t.duration=c,t.elevationGain=h,t.calcSpeed(),this._renderWorkout(t)}}// Change edit state
this.#a=!1,// Hide form + Clear input fields
this._hideForm();// Set local storage to all workouts
// this._setLocalStorage();
}_deleteWorkout(t){if(!t.target.classList.contains("btn--delete")||(// Identify the ID of the <li>
this.#r=this._matchID(t),!this.#r))return;// Delete from #workouts arrray based on the id
let e=this.#s.findIndex(t=>t.id===this.#r.id);this.#s.splice(e,1);// Delete html
let o=Array.from(i.querySelectorAll(".workout")),s=o.find(t=>t.getAttribute("data-id")===this.#r.id);s.remove(),// Delete marker + popup from map
this.#i[e].remove(),// Delete marker object from #markersArr
this.#i.splice(e,1)}_setLocalStorage(){localStorage.setItem("workouts",JSON.stringify(this.#s))}_getLocalStorage(){let t=JSON.parse(localStorage.getItem("workouts"));t&&(this.#s=t,this.#s.forEach(t=>{this._renderWorkout(t)}))}reset(){localStorage.removeItem("workouts"),location.reload()}};// app.reset();
//# sourceMappingURL=index.0998fc55.js.map

//# sourceMappingURL=index.0998fc55.js.map
