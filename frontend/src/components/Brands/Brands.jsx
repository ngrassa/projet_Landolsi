import "./Brands.css";

import michelin from "../../assets/images/Michelin.png"
//import continental from "../../assets/images/continental.png";
import bridgestone from "../../assets/images/Bridgestone.png";
import goodyear from "../../assets/images/goodyear.png";
import pirelli from "../../assets/images/Pirelli.png";
import hankook from "../../assets/images/hankook.png";
import linglong from "../../assets/images/dunlop.png";
import sailun from "../../assets/images/sailun.png";



function Brands() {

  const brands = [
    michelin,
    bridgestone,
    goodyear,
    pirelli,
    hankook,
    linglong,
    sailun
  ];


  return (
    <section className="brands"   id="nos-marques">

      <h1>
        Les meilleures marques aux meilleurs prix
      </h1>


      <div className="brands-container">

        {brands.map((brand, index) => (
          <div className="brand-card" key={index}>
            <img 
              src={brand} 
              alt="Marque pneu"
            />
          </div>
        ))}

      </div>

    </section>
  );
}


export default Brands;