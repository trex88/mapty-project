class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #markersArr = [];
  #targetWorkout = 1;
  #editState = false;

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    // this._getLocalStorage();

    // Attach event handler
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!this.#editState) {
        this._newWorkout();
      } else {
        this._updateWorkout();
      }
    });

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', e => {
      this._moveToPopup(e);
      this._editWorkout(e);
      this._deleteWorkout(e);
    });
  }

  _getPosition() {
    const options = {
      enableHighAcuracy: true,
    };

    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        },
        options
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _resetFormFormat() {
    const formRowsArr = form.children;
    inputType.value = 'running';
    formRowsArr[3].classList.remove('form__row--hidden');
    formRowsArr[4].classList.add('form__row--hidden');
  }

  _checkValidInput(...inputs) {
    const allNumbers = inputs.every(inp => Number.isFinite(inp));
    const allPositive = inputs.every(inp => inp > 0);

    return allNumbers || allPositive;
  }

  _newWorkout() {
    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    // If workout running, create running object
    if (type === 'running') {
      // Check if data is valid
      if (!this._checkValidInput(distance, duration, cadence))
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      // Check if data is valid
      if (!this._checkValidInput(distance, duration, elevation))
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + Clear input fields
    this._hideForm();

    // Reset form format
    // this._resetFormFormat();

    // Set local storage to all workouts
    // this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords);

    marker
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
    this.#markersArr.push(marker);
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <div>
          <h2 class="workout__title">${workout.description}</h2>
          <button class="workout--btn btn--edit" type="button">Edit</button>
          <button class="workout--btn btn--delete" type="button">Delete</button>
        </div>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence.toFixed(1)}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _matchID(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    return workout;
  }

  _moveToPopup(e) {
    if (e.target.closest('.workout')) {
      this.#targetWorkout = this._matchID(e);
      this.#map.setView(this.#targetWorkout.coords, this.#mapZoomLevel, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
  }

  _editWorkout(e) {
    if (!e.target.classList.contains('btn--edit')) return;

    this.#editState = true;

    // Remove target workout element
    const targetWorkoutLi = e.target.closest('.workout');
    targetWorkoutLi.remove();

    // Fill form with that workout element data
    this.#targetWorkout = this.#workouts.find(
      work => work.id === targetWorkoutLi.dataset.id
    );

    // Show form and fill form
    form.classList.remove('hidden');
    inputDistance.focus();
    inputDistance.value = this.#targetWorkout.distance;
    inputDuration.value = this.#targetWorkout.duration;
    inputType.value = this.#targetWorkout.type;

    if (this.#targetWorkout.type === 'running')
      inputCadence.value = this.#targetWorkout.cadence;
    if (this.#targetWorkout.type === 'cycling')
      inputElevation.value = this.#targetWorkout.elevationGain;
  }

  _updateWorkout() {
    const workout = this.#targetWorkout;

    // Get data from form
    const type = inputType.value;
    const workoutDistance = +inputDistance.value;
    const workoutDuration = +inputDuration.value;

    // Get coords from target workout
    const workoutCoords = workout.coords;
    const workoutCadence = +inputCadence.value;
    const workoutElevationGain = +inputElevation.value;

    // Things happen when users choose different type
    if (workout.type !== type) {
      let newWorkoutObject;

      if (type === 'running') {
        if (
          !this._checkValidInput(
            workoutDistance,
            workoutDuration,
            workoutCadence
          )
        )
          return alert('Inputs have to be positive numbers!');

        newWorkoutObject = new Running(
          workoutCoords,
          workoutDistance,
          workoutDuration,
          workoutCadence
        );
      }

      if (type === 'cycling') {
        if (
          !this._checkValidInput(
            workoutDistance,
            workoutDuration,
            workoutElevationGain
          )
        )
          return alert('Inputs have to be positive numbers!');

        newWorkoutObject = new Cycling(
          workoutCoords,
          workoutDistance,
          workoutDuration,
          workoutElevationGain
        );
      }

      this.#workouts.splice(
        this.#workouts.indexOf(workout),
        1,
        newWorkoutObject
      );
      this._renderWorkout(newWorkoutObject);

      // Remove previous marker from map (execute first) and then, from #markersArr.
      this.#markersArr[this.#workouts.indexOf(newWorkoutObject)].remove();
      this.#markersArr.splice(this.#workouts.indexOf(newWorkoutObject), 1);

      // After that, add new marker.
      this._renderWorkoutMarker(newWorkoutObject);
    }

    // Things happen when users keep the same type
    if (workout.type === type) {
      if (workout.type === 'running') {
        if (
          !this._checkValidInput(
            workoutDistance,
            workoutDuration,
            workoutCadence
          )
        )
          return alert('Inputs have to be positive numbers!');

        workout.distance = workoutDistance;
        workout.duration = workoutDuration;
        workout.cadence = workoutCadence;
        workout.calcPace();

        this._renderWorkout(workout);
      }

      if (workout.type === 'cycling') {
        if (
          !this._checkValidInput(
            workoutDistance,
            workoutDuration,
            workoutElevationGain
          )
        )
          return alert('Inputs have to be positive numbers!');
        workout.distance = workoutDistance;
        workout.duration = workoutDuration;
        workout.elevationGain = workoutElevationGain;
        workout.calcSpeed();

        this._renderWorkout(workout);
      }
    }

    // Change edit state
    this.#editState = false;

    // Hide form + Clear input fields
    this._hideForm();

    // Set local storage to all workouts
    // this._setLocalStorage();
  }

  _deleteWorkout(e) {
    if (!e.target.classList.contains('btn--delete')) return;

    // Identify the ID of the <li>
    this.#targetWorkout = this._matchID(e);

    if (!this.#targetWorkout) return;

    // Delete from #workouts arrray based on the id
    const workoutIndex = this.#workouts.findIndex(
      el => el.id === this.#targetWorkout.id
    );
    this.#workouts.splice(workoutIndex, 1);

    // Delete html
    const allWorkoutsElArr = Array.from(
      containerWorkouts.querySelectorAll('.workout')
    );
    const targetWorkoutEl = allWorkoutsElArr.find(
      el => el.getAttribute('data-id') === this.#targetWorkout.id
    );
    targetWorkoutEl.remove();

    // Delete marker + popup from map
    this.#markersArr[workoutIndex].remove();

    // Delete marker object from #markersArr
    this.#markersArr.splice(workoutIndex, 1);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

// app.reset();
