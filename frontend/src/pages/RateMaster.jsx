import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";

function RateMaster() {

  const [rateForm, setRateForm] =
    useState({

      milkType: "Cow",

      fat: "",

      snf: "",

      rate: ""

    });

  const [rates, setRates] =
    useState([]);

  useEffect(() => {

    const savedRates =
      localStorage.getItem(
        "rateMaster"
      );

    if (savedRates) {

      setRates(
        JSON.parse(savedRates)
      );

    }

  }, []);

  useEffect(() => {

    localStorage.setItem(
      "rateMaster",
      JSON.stringify(rates)
    );

  }, [rates]);

  function handleChange(e) {

    setRateForm({

      ...rateForm,

      [e.target.name]:
        e.target.value

    });

  }

  function saveRate() {

    if (
      !rateForm.fat ||
      !rateForm.snf ||
      !rateForm.rate
    ) {

      alert(
        "Fill all fields"
      );

      return;
    }

    const newRate = {

      id: Date.now(),

      ...rateForm

    };

    setRates([
      ...rates,
      newRate
    ]);

    setRateForm({

      milkType: "Cow",

      fat: "",

      snf: "",

      rate: ""

    });

  }

  return (

    <MainLayout>

      <h1>
        Rate Master
      </h1>

      <div className="collection-form">

        <select
          name="milkType"
          value={rateForm.milkType}
          onChange={handleChange}
        >

          <option>
            Cow
          </option>

          <option>
            Buffalo
          </option>

        </select>

        <input
          type="number"
          step="0.1"
          name="fat"
          placeholder="Fat"
          value={rateForm.fat}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.1"
          name="snf"
          placeholder="SNF"
          value={rateForm.snf}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.01"
          name="rate"
          placeholder="Rate"
          value={rateForm.rate}
          onChange={handleChange}
        />

        <button
          onClick={saveRate}
        >
          Save Rate
        </button>

      </div>

      <table className="member-table">

        <thead>

          <tr>

            <th>Type</th>

            <th>Fat</th>

            <th>SNF</th>

            <th>Rate</th>

          </tr>

        </thead>

        <tbody>

          {rates.map(
            (rate) => (

              <tr key={rate.id}>

                <td>
                  {rate.milkType}
                </td>

                <td>
                  {rate.fat}
                </td>

                <td>
                  {rate.snf}
                </td>

                <td>
                  ₹ {rate.rate}
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </MainLayout>

  );

}

export default RateMaster;