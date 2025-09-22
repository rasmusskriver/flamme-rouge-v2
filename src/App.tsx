import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    async function getCountries() {
      const { data, error } = await supabase.from('countries').select();
      if (error) {
        console.warn(error);
      } else if (data) {
        setCountries(data);
      }
    }

    getCountries();
  }, []);

  return (
    <div className="App">
      <h1>Supabase + React</h1>
      <p>Data hentet fra 'countries' tabellen:</p>
      {countries.length > 0 ? (
        <ul>
          {countries.map((country) => (
            <li key={country.id}>{country.name}</li>
          ))}
        </ul>
      ) : (
        <p>Loading countries...</p>
      )}
    </div>
  );
}

export default App;
