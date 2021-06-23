const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
// let map, mapEvent;


class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    console.log(this.date.getMonth(), months[this.date.getMonth()]);
    this.Description = `${inputType.value[0].toUpperCase()}${inputType.value.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running'
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
  type = 'cycling'
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this._setDescription();
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// const run1 = new Running([29,-89],)


// *****************Application*************
class App {
  #map;
  #mapEvent;
  #mapZoom = 15;
  #workouts = [];
  constructor() {

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    this._getPosition();

    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));

    this._GetLocalStorage();
  }
  _getPosition() {
    if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
        alert('cant get location')
      });
    }
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(latitude, longitude);
    const coords = [latitude, longitude];
    console.log(`https://www.google.com/maps/@${latitude},${longitude},15z`);

    this.#map = L.map('map').setView(coords, this.#mapZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);


    // handling click on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _moveToPopUp(e) {

    if (!this.#map) return;
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);
    if (workoutEl == null) return;

    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
    // workout.forEach((work)=>{
    //   if(work.id === workoutEl.dataset.id)console.log(work.id);
    // })  *or******


    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      }
    });

    // Using pubic interface
    workout.click();

  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    // Hide Form + clear fields
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
    form.style.display = 'none';
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
    form.classList.add('hidden');

  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {

    e.preventDefault();
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // getting data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value
    let workout;

    const { lat, lng } = this.#mapEvent.latlng;
    // creating running object
    if (type === 'running') {
      const cadence = +inputCadence.value
      // check if data is valid

      // if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence))
      if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
        return alert("Input have to be positive numbers");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // creating cycling object
    else if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration, elevation))
        return alert("Input have to be positive numbers");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add new object to workout array
    this.#workouts.push(workout);

    this._renderWorkoutMarker(workout);

    this._renderWorkout(workout);

    this._hideForm();

    // set local Storage
    this._SetLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords).addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      }))
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.Description}`)
      .openPopup();

  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.Description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
            <span class="workout__edit">178</span>
            <span class="workout__delete">spm</span>
          </div>
    `;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }
    else if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML("afterend", html)

  }
  _SetLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }
  _GetLocalStorage() {
    let arr = JSON.parse(localStorage.getItem('workout'));
    if (!arr) return;

    this.#workouts = arr;
    this.#workouts.forEach((element) => {
      this._renderWorkout(element);
    })
  }

  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}
const app = new App();
