import React from 'react';

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], '☀️'],
    [[1], '🌤️'],
    [[2], '⛅'],
    [[3], '☁️'],
    [[45, 48], '🌫️'],
    [[51, 56, 61, 66, 80], '🌦️'],
    [[53, 55, 63, 65, 57, 67, 81, 82], '🌧️'],
    [[71, 73, 75, 77, 85, 86], '🌨️'],
    [[95], '🌩️'],
    [[96, 99], '⛈️'],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));

  if (!arr) return 'NOT FOUND';

  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
  }).format(new Date(dateStr));
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      location: '',
      isLoading: false,
      displayLocation: {
        city: '',
        flag: '',
      },
      weather: {},
    };

    // this.fetchWeather = this.fetchWeather.bind(this);
  }

  fetchWeather = async () => {
    try {
      this.setState({ isLoading: true });

      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results) throw new Error('Location not found');

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);

      this.setState({
        displayLocation: { city: name, flag: country_code.toLowerCase() },
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();

      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.log(err);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  render() {
    return (
      <div className='app'>
        <h1>Classy Weather</h1>
        <div>
          <input
            type='text'
            placeholder='Search from location...'
            value={this.state.location}
            onChange={(e) => this.setState({ location: e.target.value })}
          />
        </div>
        <button onClick={this.fetchWeather}>Get weather</button>

        {this.state.isLoading && <p className='loader'>Loading...</p>}

        {this.state.weather.weathercode && (
          <Weather
            weather={this.state.weather}
            flag={this.state.displayLocation.flag}
            city={this.state.displayLocation.city}
          />
        )}
      </div>
    );
  }
}

export default App;

class Weather extends React.Component {
  render() {
    const {
      temperature_2m_min: min,
      temperature_2m_max: max,
      time: dates,
      weathercode: codes,
    } = this.props.weather;

    return (
      <div>
        <h2>
          Weather {this.props.city}
          <img
            src={`https://flagcdn.com/24x18/${this.props.flag}.png`}
            alt='country flag'
          />
        </h2>
        <ul className='weather'>
          {dates.map((date, i) => (
            <Day
              key={i}
              date={date}
              minTemp={min.at(i)}
              maxTemp={max.at(i)}
              code={codes.at(i)}
              isToday={i === 0}
            />
          ))}
        </ul>
      </div>
    );
  }
}

class Day extends React.Component {
  render() {
    const { date, minTemp, maxTemp, code, isToday } = this.props;

    return (
      <li className='day'>
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? 'Today' : formatDay(date)}</p>
        <p>
          {Math.floor(minTemp)}&deg; &mdash;
          <strong>{Math.ceil(maxTemp)}&deg;</strong>
        </p>
      </li>
    );
  }
}
