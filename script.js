console.log("Initialisation de la carte");

try {
    document.getElementById('map-placeholder').style.display = 'none';
    document.getElementById('map').style.display = 'block';

    const map = L.map('map').setView([20, -30], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    // Store markers per shark name
    const markers = {};

    // Toggle a single shark's visibility
    function toggleShark(name, visible) {
        if (visible) {
            markers[name].marker.addTo(map);
        } else {
            map.removeLayer(markers[name].marker);
        }
    }

    // Update the global checkbox state based on individual checkboxes
    function updateGlobalCheckbox() {
        var checkboxes = document.querySelectorAll('#shark-list input[type="checkbox"]');
        var allChecked = true;
        var noneChecked = true;

        checkboxes.forEach(function (cb) {
            if (cb.checked) { noneChecked = false; }
            else { allChecked = false; }
        });

        var globalCb = document.getElementById('cb-global');
        globalCb.checked = allChecked;
        globalCb.indeterminate = !allChecked && !noneChecked;
    }

    // Build sidebar list and markers from data
    function loadSharks(data) {
        var list = document.getElementById('shark-list');

        data.individuals.forEach(function (shark) {
            if (!shark.locations || shark.locations.length === 0) return;

            // Create marker
            var last = shark.locations[shark.locations.length - 1];
            var weight = shark.weight != null ? shark.weight + " kg" : "N/A";
            var length = shark.length != null ? shark.length + " cm" : "N/A";

            var marker = L.marker([last.lat, last.lng])
                .addTo(map)
                .bindPopup(
                    "<strong>" + shark.name + "</strong><br>" +
                    "🦈 " + shark.species + "<br>" +
                    shark.gender + "<br>" +
                    "⚖️ " + weight + " | 📏 " + length + "<br>" +
                    "📅 " + last.timestamp
                );

            markers[shark.name] = { marker: marker, lat: last.lat, lng: last.lng };

            // Create list item
            var li = document.createElement('li');

            // Target icon to zoom to shark
            var target = document.createElement('span');
            target.className = 'shark-target';
            target.textContent = '🎯';
            target.title = 'Centrer sur ' + shark.name;
            target.addEventListener('click', function () {
                var info = markers[shark.name];
                // Make sure the shark is visible
                var cb = document.getElementById('cb-' + shark.name);
                if (!cb.checked) {
                    cb.checked = true;
                    toggleShark(shark.name, true);
                    updateGlobalCheckbox();
                }
                map.setView([info.lat, info.lng], 8);
                info.marker.openPopup();
            });

            // Checkbox
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.id = 'cb-' + shark.name;
            checkbox.addEventListener('change', function () {
                toggleShark(shark.name, this.checked);
                updateGlobalCheckbox();
            });

            // Label (clicking it toggles the checkbox)
            var label = document.createElement('label');
            label.className = 'shark-name';
            label.textContent = shark.name;
            label.htmlFor = 'cb-' + shark.name;

            li.appendChild(checkbox);
            li.appendChild(label);
            li.appendChild(target);
            list.appendChild(li);
        });
    }

    // Setup global checkbox
    document.getElementById('cb-global').addEventListener('change', function () {
        var checked = this.checked;
        var checkboxes = document.querySelectorAll('#shark-list input[type="checkbox"]');

        checkboxes.forEach(function (cb) {
            cb.checked = checked;
            var name = cb.id.replace('cb-', '');
            toggleShark(name, checked);
        });
    });

    // Load JSON data
    fetch("data/sharks-2019.json")
        .then(function (res) { return res.json(); })
        .then(function (data) { loadSharks(data); })
        .catch(function (err) { console.error("Erreur chargement JSON :", err); });

} catch (e) {
    document.getElementById('map-placeholder').style.display = 'flex';
    document.getElementById('map').style.display = 'none';
    console.error("Erreur d'initialisation de la carte :", e);
}
