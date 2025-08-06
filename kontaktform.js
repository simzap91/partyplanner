// kontaktform.js

let selectedAddons = {
    lights: 0,
    names: 0,
    tables: 0
  };

function showSummary() {
      document.getElementById("userFormBox").style.display = "none";
      document.getElementById("summaryBox").style.display = "block";
}
  
  function showAddonsForm() {
    document.getElementById("summaryBox").style.display = "none";
    document.getElementById("userFormBox").style.display = "none";
  
    document.getElementById("userFormBox").innerHTML = `
      <p><strong>Tillval:</strong></p>
      <label>Ljuspaket (50 kr/bord):</label><br>
      <input type="number" id="addonLights" placeholder="Antal" min="0" style="width: 100%; padding: 8px; margin-bottom: 8px;"><br>
  
      <label>Namnskyltar (5 kr/st):</label><br>
      <input type="number" id="addonNames" placeholder="Antal" min="0" style="width: 100%; padding: 8px; margin-bottom: 8px;"><br>
  
      <label>Bordsskyltar (20 kr/st):</label><br>
      <input type="number" id="addonTables" placeholder="Antal" min="0" style="width: 100%; padding: 8px; margin-bottom: 8px;"><br>
  
      <button type="button" onclick="showSummary()">← Tillbaka</button>
      <button onclick="showContactForm()">Gå vidare</button>
      <button onclick="document.getElementById('userFormBox').style.display='none'">Avbryt</button>
    `;
  
    document.getElementById("userFormBox").style.display = "block";
  }
  
  function showContactForm() {
    // Spara tillval innan formulär byts ut
    selectedAddons.lights = parseInt(document.getElementById("addonLights")?.value || 0);
    selectedAddons.names = parseInt(document.getElementById("addonNames")?.value || 0);
    selectedAddons.tables = parseInt(document.getElementById("addonTables")?.value || 0);
  
    //document.getElementById("userFormBox").style.display = "none";
  
    document.getElementById("userFormBox").innerHTML = `
      <p><strong>Uppgifter:</strong></p>
      <input type="text" id="userName" placeholder="Namn" style="width: 100%; padding: 8px; margin-bottom: 8px;"><br>
      <input type="text" id="userAddress" placeholder="Adress" style="width: 100%; padding: 8px; margin-bottom: 8px;"><br>
      <input type="text" id="userZip" placeholder="Postnummer" style="width: 100%; padding: 8px; margin-bottom: 8px;"><br>
      <input type="text" id="userCity" placeholder="Stad" style="width: 100%; padding: 8px; margin-bottom: 8px;"><br>
      <input type="text" id="userPhone" placeholder="Telefonnummer" style="width: 100%; padding: 8px; margin-bottom: 8px;"><br>
  
      <label><input type="radio" name="delivery" value="Stockholm"> Jag vill hämta upp min beställning i Stockholm</label><br>
      <label><input type="radio" name="delivery" value="Göteborg"> Jag vill hämta upp min beställning i Göteborg</label><br>
      <label><input type="radio" name="delivery" value="Skickad"> Jag vill få beställningen skickad till mig på ovan adress</label><br><br>
  
      <label>Önskat datum:</label><br>
      <input type="date" id="deliveryDate" style="width: 100%; padding: 8px;"><br><br>
  
      <button type="button" onclick="showAddonsForm()">← Tillbaka</button>
      <button onclick="sendEmail()">Gå vidare</button>
      <button onclick="document.getElementById('userFormBox').style.display='none'">Avbryt</button>
    `;
  
    const dateInput = document.getElementById("deliveryDate");
    const today = new Date();
    today.setDate(today.getDate() + 14);
    dateInput.min = today.toISOString().split("T")[0];
  
    document.getElementById("userFormBox").style.display = "block";
  }
  
  function sendEmail() {
    const overdrag = document.getElementById("overdragCount").textContent;
    const liten = document.getElementById("litenDukCount").textContent;
    const mellan = document.getElementById("mellanDukCount").textContent;
    const stor = document.getElementById("storDukCount").textContent;
    const runtMellan = document.getElementById("runtMellanDukCount").textContent;
    const runtStor = document.getElementById("runtStorDukCount").textContent;
  
    const name = document.getElementById("userName").value;
    const address = document.getElementById("userAddress").value;
    const zip = document.getElementById("userZip").value;
    const city = document.getElementById("userCity").value;
    const phone = document.getElementById("userPhone").value;
    const date = document.getElementById("deliveryDate").value;
    const deliveryOption = document.querySelector('input[name="delivery"]:checked')?.value || "Ej valt";
  
    const lights = selectedAddons.lights;
    const names = selectedAddons.names;
    const tables = selectedAddons.tables;
  
    const lightsPrice = lights * 50;
    const namesPrice = names * 5;
    const tablesPrice = tables * 20;
    const totalAddons = lightsPrice + namesPrice + tablesPrice;
  
    const subject = encodeURIComponent("Beställning – Bordsplacering");
    const body = encodeURIComponent(
      `Hej,\n\nHär kommer en sammanställning av min beställning:\n\n` +
      `Beställning:\n` +
      `• Stolsöverdrag: ${overdrag} st\n` +
      `• Liten duk: ${liten} st\n` +
      `• Mellanduk: ${mellan} st\n` +
      `• Stor duk: ${stor} st\n` +
      `• Runt bord mellanduk: ${runtMellan} st\n` +
      `• Runt bord stor duk: ${runtStor} st\n\n` +
      `Kontaktuppgifter:\n` +
      `Namn: ${name}\nAdress: ${address}\nPostnummer: ${zip}\nStad: ${city}\nTelefon: ${phone}\n` +
      `Leveransval: ${deliveryOption}\nÖnskat datum: ${date}\n\n` +
      `Tillval:\n` +
      `• Ljuspaket: ${lights} st (${lightsPrice} kr)\n` +
      `• Namnskyltar: ${names} st (${namesPrice} kr)\n` +
      `• Bordsskyltar: ${tables} st (${tablesPrice} kr)\n` +
      `• Totalt tillval: ${totalAddons} kr\n\n` +
      `OBS: Dukar är ej tillgängliga för beställning. Endast stolsöverdrag kan levereras.\n\n` +
      `Med vänlig hälsning`
    );
  
    window.location.href = `mailto:hejhej@gamil.com?subject=${subject}&body=${body}`;
  }
  