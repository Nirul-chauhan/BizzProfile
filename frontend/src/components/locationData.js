export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Cambodia", "Cameroon", "Canada",
  "Chile", "China", "Colombia", "Croatia", "Cuba", "Czech Republic", "Denmark",
  "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Georgia",
  "Germany", "Ghana", "Greece", "Guatemala", "Honduras", "Hong Kong", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia",
  "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Mexico", "Mongolia", "Morocco",
  "Myanmar", "Nepal", "Netherlands", "New Zealand", "Nigeria", "North Korea", "Norway",
  "Oman", "Pakistan", "Palestine", "Panama", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Senegal",
  "Serbia", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa",
  "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Taiwan",
  "Tanzania", "Thailand", "Tunisia", "Turkey", "UAE", "Uganda", "Ukraine",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam",
  "Yemen", "Zimbabwe"
];

export const STATES_BY_COUNTRY = {
  India: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
    "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
    "Puducherry"
  ],
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
    "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland"
  ],
  Canada: [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick",
    "Newfoundland and Labrador", "Nova Scotia", "Ontario",
    "Prince Edward Island", "Quebec", "Saskatchewan"
  ],
  Australia: [
    "Australian Capital Territory", "New South Wales", "Northern Territory",
    "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"
  ],
};

export const CITIES_BY_STATE = {
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Kalyan-Dombivli",
    "Vasai-Virar", "Aurangabad", "Solapur", "Mira-Bhayandar", "Bhiwandi",
    "Amravati", "Nanded", "Kolhapur", "Ulhasnagar", "Sangli-Miraj-Kupwad",
    "Malegaon", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar",
    "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna", "Ambarnath",
    "Bhusawal", "Panvel", "Badlapur", "Beed", "Gondia", "Satara",
    "Barshi", "Yavatmal", "Achalpur", "Osmanabad", "Nandurbar",
    "Wardha", "Udgir", "Hinganghat"
  ],
  "Karnataka": [
    "Bangalore", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum",
    "Gulbarga", "Davangere", "Bellary", "Bijapur", "Shimoga",
    "Tumkur", "Raichur", "Bidar", "Hospet", "Mandya", "Hassan",
    "Gadag-Betigeri", "Udupi", "Bhatkal", "Karwar", "Madikeri",
    "Ramanagara", "Chikkamagaluru", "Kolar", "Chitradurga"
  ],
  "Delhi": [
    "New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi",
    "West Delhi", "North East Delhi", "North West Delhi", "South East Delhi",
    "South West Delhi", "Shahdara", "Outer Delhi"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
    "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul",
    "Thanjavur", "Ranipet", "Sivakasi", "Aruppukkotai", "Neyveli",
    " Hosur", "Nagercoil", "Kumbakonam", "Udhagamandalam", "Kancheepuram"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar",
    "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Mehsana",
    "Bharuch", "Vapi", "Bhuj", "Porbandar", "Patan", "Veraval",
    "Godhra", "Palanpur", "Valsad", "Jetpur", "Dwarka", "Junagadh"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Ajmer", "Udaipur", "Bikaner",
    "Alwar", "Bharatpur", "Bhilwara", "Sikar", "Pali", "Kishangarh",
    "Beawar", "Dholpur", "Hanumangarh", "Churu", "Nagaur", "Jhunjhunu",
    "Baran", "Dausa", "Tonk", "Bundi", "Sawai Madhopur", "Chittorgarh"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Allahabad",
    "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur",
    "Noida", "Ghaziabad", "Jhansi", "Agra", "Mathura", "Firozabad",
    "Rampur", "Shahjahanpur", "Fatehpur", "Budaun", "Azamgarh",
    "Bahraich", "Sitapur", "Bijnor", "Bulandshahr", "Etawah"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman",
    "Kharagpur", "Haldia", "Raiganj", "Krishnanagar", "Medinipur",
    "Balurghat", "Alipurduar", "Cooch Behar", "Darjeeling", "Kalimpong",
    "Jalpaiguri", "Malda", "Murshidabad", "Nadia", "Purba Medinipur",
    "Paschim Medinipur", "Bankura", "Purulia", "Birbhum", "Burdwan"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar",
    "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Medak",
    "Rangareddy", "Vikarabad", "Siddipet", "Mancherial", "Kamareddy",
    "Suryapet", "Jagtial", "Miryalaguda", "Nirmal", "Bodhan"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur",
    "Palakkad", "Alappuzha", "Malappuram", "Kottayam", "Kanhangad",
    "Kasargod", "Thalassery", "Pala", "Kochi", "Attingal", "Kayamkulam",
    "Nedumangad", "Guruvayur", "Kodungallur", "Muvattupuzha"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar",
    "Dewas", "Satna", "Ratlam", "Rewa", "Murwara (Katni)", "Singrauli",
    "Burhanpur", "Khandwa", "Bhind", "Chhindwara", "Guna", "Shivpuri",
    "Vidisha", "Chhatarpur", "Damoh", "Mandsaur", "Khargone", "Neemuch"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali",
    "Hoshiarpur", "Batala", "Pathankot", "Moga", "Abohar", "Malerkotla",
    "Khanna", "Phagwara", "Muktsar", "Barnala", "Rajpur", "Sirhind",
    "Kapurthala", "Tarn Taran", "Jalandhar", "Ferozepur", "Kasur"
  ],
  "Haryana": [
    "Gurgaon", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar",
    "Rohtak", "Sonipat", "Yamunanagar", "Panchkula", "Bhiwani",
    "Sirsa", "Bahadurgarh", "Jind", "Thanesar", "Kaithal", "Palwal",
    "Rewari", "Narnaul", "Hansi", "Mahendragarh", "Charkhi Dadri"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Arrah",
    "Begusarai", "Katihar", "Munger", "Purnia", "Saharsa", "Sitamarhi",
    "Vaishali", "Samastipur", "Buxar", "Kaimur", "Rohtas", "Jehanabad",
    "Aurangabad", "Nalanda", "Banka", "Lakhisarai", "Sheikhpura", "Ekma"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
    "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Jeypore",
    "Barbil", "Kendujhar", "Angul", "Dhenkanal", "Rayagada", "Koraput",
    "Paralakhemundi", "Bolangir", "Kendrapara", "Jagatsinghpur",
    "Pattamundai", "Nayagarh", "Khurda"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon",
    "Jagdalpur", "Ambikapur", "Dhamtari", "Raigarh", "Kawardha",
    "Kabirdham", "Janjgir-Champa", "Surguja", "Koriya", "Surajpur",
    "Balod", "Bemetara", "Mungeli", "Dantewada", "Bijapur", "Narayanpur"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia",
    "Tezpur", "Bongaigaon", "Dhubri", "North Lakhimpur", "Karimganj",
    "Sivasagar", "Goalpara", "Barpeta", "Morigaon", "Nalbari", "Darrang",
    "Kamrup", "Golaghat", "Jorhat", "Cachar", "Hailakandi", "Karbi Anglong"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar",
    "Phusro", "Hazaribag", "Giridih", "Netarhat", "Palamu", "Dumka",
    "Godda", "Sahebganj", "Pakur", "Jamtara", "Simdega", "Khunti",
    "Gumla", "Lohardaga", "Latehar", "Chaibasa", "Seraikela", "Ramgarh"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Haldwani", "Roorkee", "Kashipur", "Rudrapur",
    "Hrishikesh", "Pithoragarh", "Tehri", "Almora", "Nainital", "Chamoli",
    "Uttarkashi", "Pauri", "Champawat", "Bageshwar", "Rudraprayag"
  ],
  "Himachal Pradesh": [
    "Shimla", "Manali", "Dharamshala", "Kullu", "Mandi", "Solan",
    "Palampur", "Baddi", "Nahan", "Hamirpur", "Una", "Kangra",
    "Chamba", "Bilaspur", "Kinnaur", "Lahaul and Spiti"
  ],
  "Goa": [
    "Panaji", "Vasco da Gama", "Margao", "Mapusa", "Ponda", "Colva",
    "Calangute", "Candolim", "Sinquerim", "Anjuna", "Arambol", "Morjim"
  ],
  "Jammu and Kashmir": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Kathua",
    "Sopore", "Pattan", "Budgam", "Kupwara", "Handwara", "Bandipora",
    "Ganderbal", "Pulwama", "Shopian", "Kulgam", "Kishtwar", "Doda",
    "Ramban", "Reasi", "Poonch", "Rajouri", "Samba", "Kathua"
  ],
  Ladakh: [
    "Leh", "Kargil", "Nubra", "Zanskar", "Changthang", "Drass"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
    "Rajahmundry", "Tirupati", "Kakinada", "Eluru", "Anantapur",
    "Kadapa", "Ongole", "Chittoor", "Machilipatnam", "Adoni",
    "Tenali", "Proddatur", "Bhimavaram", "Guntakal", "Nandyal"
  ],
  "Arunachal Pradesh": [
    "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila",
    "Tezu", "Changlang", "Yingkiong", "Along", "Daporijo", "Boleng"
  ],
  "Manipur": [
    "Imphal", "Thoubal", "Lilong", "Mayang Imphal", "Kakching",
    "Churachandpur", "Kohima", "Ukhrul", "Senapati", "Tamenglong",
    "Chandel", "Jiribam"
  ],
  "Meghalaya": [
    "Shillong", "Tura", "Cherrapunji", "Jowai", "Baghmara", "Nongstoin",
    "Williamnagar", "Resubelpara", "Ampati", "Mairang", "Nongpoh"
  ],
  "Mizoram": [
    "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip",
    "Lawngtlai", "Mamit", "Saitual", "Khawzawl", "Hnahthial"
  ],
  "Nagaland": [
    "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto",
    "Phek", "Longleng", "Kiphire", "Peren", "Mon", "Noklak"
  ],
  "Sikkim": [
    "Gangtok", "Namchi", "Gyalshing", "Rangpo", "Singtam", "Jorethang",
    "Nayabazar", "Mangan", "Lachung", "Lachen", "Pelling"
  ],
  "Tripura": [
    "Agartala", "Dharmanagar", "Udaipur", "Ambassa", "Belonia", "Kailasahar",
    "Khowai", "Sabroom", "Sonamura", "Kamalpur", "Melaghar", "Bishalgarh"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur",
    "Palakkad", "Alappuzha", "Malappuram", "Kottayam", "Kanhangad",
    "Kasargod", "Thalassery", "Pala", "Attingal", "Kayamkulam",
    "Nedumangad", "Guruvayur", "Kodungallur", "Muvattupuzha"
  ],
  "Puducherry": [
    "Puducherry", "Karaikal", "Mahe", "Yanam"
  ],
  "Chandigarh": [
    "Chandigarh"
  ],
  "Lakshadweep": [
    "Kavaratti", "Agatti", "Minicoy", "Amini", "Androth", "Kalpeni",
    "Kadmat", "Kiltan", "Chetlat", "Bitra", "Bangaram", "Thinnakara"
  ],
  "Andaman and Nicobar Islands": [
    "Port Blair", "Havelock Island", "Neil Island", "Diglipur",
    "Rangat", "Mayabunder", "Car Nicobar", "Great Nicobar"
  ],
  "Dadra and Nagar Haveli": [
    "Silvassa", "Dadra", "Nagar Haveli"
  ],
  "Daman and Diu": [
    "Daman", "Diu"
  ],
};

export function getCitiesForState(state) {
  return CITIES_BY_STATE[state] || [];
}

export function getStatesForCountry(country) {
  return STATES_BY_COUNTRY[country] || [];
}
