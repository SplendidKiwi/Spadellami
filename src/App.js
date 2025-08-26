import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica tutte le ricette da A-Z in parallelo
  useEffect(() => {
    const fetchAllMeals = async () => {
      try {
        setLoading(true);

        const letters = Array.from({ length: 26 }, (_, i) =>
          String.fromCharCode(97 + i) // a-z
        );

        // richieste in parallelo
        const responses = await Promise.all(
          letters.map((letter) =>
            fetch(
              `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`
            ).then((res) => res.json())
          )
        );

        // unisci tutti i risultati
        const allMeals = responses
          .map((data) => data.meals || [])
          .flat();

        setRecipes(allMeals);
        setFiltered(allMeals);
      } catch (err) {
        console.error(err);
        setError("Impossibile caricare le ricette.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllMeals();
  }, []);

  // Filtro per ingredienti
  const handleFilter = () => {
    if (!search.trim()) {
      setFiltered(recipes);
      return;
    }

    const query = search
      .toLowerCase()
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i);

    const filteredRecipes = recipes.filter((meal) => {
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        if (ing) ingredients.push(ing.toLowerCase());
      }
      return query.every((q) => ingredients.includes(q));
    });

    setFiltered(filteredRecipes);
  };

  // Lista ingredienti con quantità
  const getIngredients = (meal) => {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim()) list.push(`${ing} - ${measure}`);
    }
    return list;
  };

  return (
    <div className="app">
      <h1>🍴 Ricette Facili</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Inserisci ingredienti (es. chicken, tomato)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleFilter}>Cerca</button>
      </div>

      {loading && <p>Caricamento ricette...</p>}
      {error && <p className="error">{error}</p>}

      {selected ? (
        <div className="recipe-detail">
          <button className="back-btn" onClick={() => setSelected(null)}>
            ⬅ Torna alle ricette
          </button>
          <h2>{selected.strMeal}</h2>
          <img src={selected.strMealThumb} alt={selected.strMeal} />
          <h3>Ingredienti</h3>
          <ul>
            {getIngredients(selected).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
          <h3>Istruzioni</h3>
          <p>{selected.strInstructions}</p>
        </div>
      ) : (
        <div className="recipe-list">
          {filtered.map((meal) => (
            <div
              key={meal.idMeal}
              className="recipe-card"
              onClick={() => setSelected(meal)}
            >
              <img src={meal.strMealThumb} alt={meal.strMeal} />
              <div className="recipe-info">
                <h2>{meal.strMeal}</h2>
                <p>{meal.strInstructions.substring(0, 150)}...</p>
                <div className="ingredients">
                  <strong>Ingredienti:</strong>
                  <ul>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const ing = meal[`strIngredient${i + 1}`];
                      return ing ? <li key={i}>{ing}</li> : null;
                    })}
                  </ul>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && <p>Nessuna ricetta trovata.</p>}
        </div>
      )}
    </div>
  );
}
