import React from 'react'

export default function CardsSection() {
 const cards = [
    { title: "فروش", text: "جزئیات", img: "holder.js/100px180/" },
    { title: "پکیج", text: "جزئیات", img: "holder.js/100px180/" },
    { title: "عنوان 2", text: "جزئیات", img: "holder.js/100px180/" },
    { title: "عنوان 3", text: "جزئیات", img: "holder.js/100px180/" },
  ];

  return (
    <div className="row align-items-center mt-5">
      <div className="col-xs-12 col-sm-12 col-md-7 text-center">
        <div className="row">
          {cards.map((card, index) => (
            <div key={index} className="col-sm-6">
              <div className="card text-white bg-secondary my-5">
                <img className="card-img-top" src={card.img} alt={card.title} />
                <div className="card-body">
                  <h4 className="card-title">{card.title}</h4>
                  <p className="card-text">{card.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

