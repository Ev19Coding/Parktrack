
// src/data/parks.ts
export interface Park {
  id: string;
  name: string;
  location: string;
  activities: string[];
  images: string[];
  description: string;
}



export const parkdata = [
  {
    id: 1,
    name: "Millennium Park",
    about: "Millennium Park is located in Abuja. It offers open green spaces and various activities...",
    hours: "Open until 8:00 PM",
    phone: "0805 554 3487",
    website: " ",
    address: "22 Sakode Crescent, Wuse Zone 5, off Micheal Okpara Way",
    city: "Abuja",
    neighborhood: "Wuse",
    postal: "905102",
    region: "Federal Capital Territory, Nigeria",
    country: "Nigeria",
    photos: [
      "/images/greenpark1.jpg",
      "/images/greenpark2.jpg",
      "/images/greenpark3.jpg"
    ],
    goodForKids: true,
    wheelchairAccessible: "Yes, Parking",
    price: "$",
    categories: ["Public parks", "Hotels and motels", "Short term accommodation activities"],
    isicCodes: ["5510", "9329"],
    social: {
      facebook: "https://facebook.com/millenniumpark",
      instagram: "https://instagram.com/millenniumpark",
    }
  },
  {
    id: 2,
    name: "Jabi Lake Park",
    about: "Jabi Lake Park offers lakeside views, jogging paths, and water activities...",
    hours: "Open until 10:00 PM",
    phone: "0803 112 2233",
    website: " ",
    address: "Jabi Lake, Jabi District",
    city: "Abuja",
    neighborhood: "Jabi",
    postal: "905102",
    region: "Federal Capital Territory, Nigeria",
    country: "Nigeria",
    photos: [
      "/public/images/Jabi-Lake-Waterfront.jpg",
      "/images/jabi2.jpg",
      "/images/jabi3.jpg"
    ],
    goodForKids: true,
    wheelchairAccessible: "Partial access",
    price: "$$",
    categories: ["Lakes", "Parks"],
    isicCodes: ["9329"],
    social: {
      facebook: "https://facebook.com/jabilakepark",
      instagram: "https://instagram.com/jabilakepark",
    }
  },
  {
    id: 3,
    name: "Central Park Abuja",
    about: "Central Park offers outdoor dining, go-kart racing, and playgrounds...",
    hours: "Open until 9:00 PM",
    phone: "0806 778 9900",
    website: "https://centralparkabuja.com",
    address: "Bala Sokoto Way, Area 11",
    city: "Abuja",
    neighborhood: "Area 11",
    postal: "905102",
    region: "Federal Capital Territory, Nigeria",
    country: "Nigeria",
    photos: [
      "/images/centralpark1.jpg",
      "/images/centralpark2.jpg",
      "/images/centralpark3.jpg"
    ],
    goodForKids: true,
    wheelchairAccessible: "Yes",
    price: "$$$",
    categories: ["Recreational", "Restaurants"],
    isicCodes: ["9329"],
    social: {
      facebook: "https://facebook.com/centralparkabuja",
      instagram: "https://instagram.com/centralparkabuja",
    }
  },
    {

    id: 4,
    name: "Urban Village by Terivik Park",
    about: "Urban Village is located in Abuja. It offers open green spaces and various activities...",
    hours: "Open until 8:00 PM",
    phone: "0800 123 4567",
    website: "...",
    address: "3FWJ+R35, Nile St, Fct, Abuja 904101, Federal Capital Territory",
    city: "Abuja",
    neighborhood: "Maitama",
    postal: "905102",
    region: "Federal Capital Territory, Nigeria",
    country: "Nigeria",
    photos: [
      "/images/greenpark1.jpg",
      "/images/greenpark2.jpg",
      "/images/greenpark3.jpg"
    ],
    goodForKids: true,
    wheelchairAccessible: "Yes, Parking",
    price: "$",
    categories: ["Public parks", "Hotels and motels", "Short term accommodation activities"],
    isicCodes: ["5510", "9329"],
    social: {
      facebook: "...",
      instagram: "...",
    }
  },
  


  {
    id: 5,
    name: "Central Park",
    hours: "Open until 10:00 PM",
    phone: "0803 112 2233",
    website: " ",
    address: "70 Kur Mohammed Ave, Garki 1, Abuja 900103, Federal Capital Territory",
    city: "Abuja",
    neighborhood: "Garki 1",
    postal: "...",
    region: "Federal Capital Territory, Nigeria",
    country: "Nigeria",
    photos: [
      "/images/jabi1.jpg",
      "/images/jabi2.jpg",
      "/images/jabi3.jpg"
    ],
    goodForKids: true,
    wheelchairAccessible: "...",
    price: "$$",
    categories: ["...", "..."],
    isicCodes: ["9329"],
    social: {
      facebook: "https://facebook.com/jabilakepark",
      instagram: "https://instagram.com/jabilakepark",
    }
    
  },
  /*{
    id: "",
    name: "",
    hours: "",
    phone: "",
    website: " ",
    address: "",
    city: "Abuja",
    neighborhood: "",
    postal: "...",
    region: "Federal Capital Territory, Nigeria",
    country: "Nigeria",
    photos: [
      "/public/images/Jabi-Lake-Waterfront.jpg",
      "/images/jabi2.jpg",
      "/images/jabi3.jpg"
    ],
    goodForKids: true,
    wheelchairAccessible: "...",
    price: "$$",
    categories: ["Lakes", "Parks"],
    isicCodes: ["9329"],
    social: {
      facebook: "https://facebook.com/jabilakepark",
      instagram: "https://instagram.com/jabilakepark",
    }
    
  },

  {
    id: "central-park",
    name: "Central Park",
    lat:9.072193,
    lng:7.3695141,
    entryFee: "Free",
    phone: "+234 800 987 6543",
    address: "70 Kur Mohammed Ave, Garki 1, Abuja 900103, Federal Capital Territory",
    
  },

  {
    id: "kaspaland-park",
    name: "Kaspaland Kayak",
    lat: 9.029953899999999,
    lng: 7.447600800000001,
    entryFee: "₦2,000",
    phone: "+234 800 123 4567",
    address: "Package B, Chartered Farms, National Stadium, Kukwaba, Abuja",
    
  },
  {
    id: "delight",
    name: "De light Garden & park Gate 2",
    lat: 9.0040405,
    lng:7.482600099999999,
    entryFee: "Free",
    phone: "+234 800 123 4567",
    address: "Plot 990, Joshua Madaki Close, Apo, Zone E, Abuja",
    
  },

  {
    id: "orisun-art",
    name: "Orisun Art Gallery",
    lat: 9.0541746,
    lng: 7.4787569,
    entryFee: "Free",
    phone: "+234 800 987 6543",
    address: "1st Floor, Tropic Gallery Mall, beside Grand Square, Central Business District, Abuja 900211",
    
  },
  {
    id: "bmt",
    name: "BMT African Garden",
    lat: 9.0697323,
    lng: 7.4794953,
    entryFee: "₦500",
    phone: "+234 800 123 4567",
    address: "155 Adetokunbo Ademola Cres, Wuse, Abuja 904101, Federal Capital Territory",
    
  },
  {
    id: "mungo",
    name: "Mungo Park Asokoro",
    lat: 9.0426875,
    lng: 7.507859400000001,
    entryFee: "₦500",
    phone: "+234 800 123 4567",
    address: "2GV5+34H, Garki 2, Abuja 900103, Federal Capital Territory",
    
  },

  {
    id: "central-Park",
    name: "Rabby Recreation Park",
    lat: 9.082291699999999,
    lng:7.3707905,
    entryFee: "Free",
    phone: "+234 800 987 6543",
    address: "Paradise Estate Rd, Dape District, Abuja 900108, Federal Capital Territory",
    
  },
  
  {
    id: "millennium-park",
    name: "Sarius Palmetum Botanical Gardens",
    lat: 9.101553899999999,
    lng: 7.4894208,
    entryFee: "₦500",
    phone: "+234 800 123 4567",
    address: "4 Salween Cl, Maitama, Abuja 904101, Federal Capital Territory",
    
  },
  {
    id: "acropolis-park",
    name: "Eden Botanical Gardens",
    lat: 9.0793972,
    lng:7.4226474,
    entryFee: "Free",
    phone: "+234 800 123 4567",
    address: "Shehu Yar'adua Wy, Jabi, Abuja 900108, Federal Capital Territory",
    
  },

  {
    id: "jabi-lake",
    name: "City Park Abuja",
    lat: 9.0742225,
    lng: 7.4784967,
    entryFee: "Free",
    phone: "+234 800 987 6543",
    address: "Ahmadu Bello Wy, Wuse, Abuja 904101, Federal Capital Territory",
    
  },
  {
    id: "urban-village",
    name: "Unique Garden",
    lat: 9.0594611,
    lng: 7.458906,
    entryFee: "₦500",
    phone: "+234 800 123 4567",
    address: "9 Accra St, Wuse, Abuja 904101, Federal Capital Territory",
    
  },
  {
    id: "suncity-park",
    name: "Area 1 Recreation Garden",
    lat:  9.0320451,
    lng: 7.4714332,
    entryFee: "₦500",
    phone: "+234 800 123 4567",
    address: "Treasure Island, Zoological Park, Opp. Shopping Complex, Area 1, Garki, Abuja, FCT",
    
  },

  {
    id: "central-park",
    name: "Par Excellence Waterfall & Park",
    lat:9.0577277,
    lng:7.458126999999998,
    entryFee: "Free",
    phone: "+234 800 987 6543",
    address: "Zone 5, 2044 Michael Okpara St, Wuse, Abuja 904101, Federal Capital Territory",
    
  },

  {
    id: "kaspaland-park",
    name: "Nook Garden",
    lat: 9.0636765,
    lng: 7.4590771,
    entryFee: "₦2,000",
    phone: "+234 800 123 4567",
    address: "2027 Dalaba St, Wuse, Abuja 904101, Federal Capital Territory",
    
  },
  {
    id: "delight",
    name: "LivingBrooks Park & Garden",
    lat: 9.0454175,
    lng:7.5095722,
    entryFee: "Free",
    phone: "+234 800 123 4567",
    address: "Jesse Jackson St, Asokoro, Abuja 900231, Federal Capital Territory",
    
  },

  {
    id: "orisun-art",
    name: "Orisun Art Gallery",
    lat: 9.0541746,
    lng: 7.4787569,
    entryFee: "Free",
    phone: "+234 800 987 6543",
    address: "1st Floor, Tropic Gallery Mall, beside Grand Square, Central Business District, Abuja 900211",
    
  },
  {
    id: "bmt",
    name: "BMT African Garden",
    lat: 9.0697323,
    lng: 7.4794953,
    entryFee: "₦500",
    phone: "+234 800 123 4567",
    address: "155 Adetokunbo Ademola Cres, Wuse, Abuja 904101, Federal Capital Territory",
    
  },
  {
    id: "mungo",
    name: "Mungo Park Asokoro",
    lat: 9.0426875,
    lng: 7.507859400000001,
    entryFee: "₦500",
    phone: "+234 800 123 4567",
    address: "2GV5+34H, Garki 2, Abuja 900103, Federal Capital Territory",
    
  },

  {
    id: "central-Park",
    name: "Rabby Recreation Park",
    lat: 9.082291699999999,
    lng:7.3707905,
    entryFee: "Free",
    phone: "+234 800 987 6543",
    address: "Paradise Estate Rd, Dape District, Abuja 900108, Federal Capital Territory",
    
  }*/
];

