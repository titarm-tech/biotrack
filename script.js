console.log("Initialisation de la carte");

try {
    // Store markers per shark name
    const markers = {};
    const colors = [
        '#E63946', '#2A9D8F', '#E9C46A', '#F4A261', '#264653',
        '#6A4C93', '#1982C4', '#8AC926', '#FF595E', '#FFCA3A',
        '#6A994E', '#C77DFF', '#F77F00', '#4CC9F0', '#D62828',
        '#3A86FF', '#FB5607', '#8338EC', '#06D6A0', '#FFB703',
        '#CB4335', '#1A5276', '#148F77', '#D35400', '#7D3C98'
    ];
    let colorIndex = 0;
    function clearSharks() {
        console.log("clearSharks");
        Object.values(markers).forEach(function (info) {
            map.removeLayer(info.marker);
            map.removeLayer(info.polyline);
            info.dots.forEach(function (dot) { map.removeLayer(dot); });
        });
        // Vide l'objet markers et la liste HTML
        Object.keys(markers).forEach(function (k) { delete markers[k]; });
        document.getElementById('shark-list').innerHTML = '';
    }

    function loadYear(year) {
        console.log("loadYear");
        clearSharks();
        fetch("data/sharks-" + year + ".json")
            .then(function (res) { return res.json(); })
            .then(function (data) { loadSharks(data); })
            .catch(function (err) { console.error("Erreur chargement JSON :", err); });
    }

    document.getElementById('map-placeholder').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    document.getElementById('year-select').addEventListener('change', function () {
        console.log("year-select:change");
        loadYear(this.value);
    });

    const map = L.map('map').setView([20, -30], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    // Toggle a single shark's visibility
    function toggleShark(name, visible) {
        if (visible) {
            markers[name].marker.addTo(map);
            markers[name].polyline.addTo(map);

            markers[name].dots.forEach(function (dot) {
                dot.addTo(map);
            });
        } else {
            map.removeLayer(markers[name].marker);
            map.removeLayer(markers[name].polyline);

            markers[name].dots.forEach(function (dot) {
                map.removeLayer(dot);
            });
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
            var latlngs = shark.locations.map(function (loc) {
                return [loc.lat, loc.lng];
            });

            var color = colors[colorIndex % colors.length];
            colorIndex++;

            var polyline = L.polyline(latlngs, {
                color: color,
                weight: 3.5,
                opacity: 1
            }).addTo(map);

            var dots = shark.locations.map(function (loc) {
                return L.circleMarker([loc.lat, loc.lng], {

                    radius: 5,
                    color: color,
                    fillColor: color,
                    fillOpacity: 1,
                    weight: 0
                }).addTo(map);
            });

            markers[shark.name] = { marker: marker, polyline: polyline, dots: dots, lat: last.lat, lng: last.lng };

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

            var dot = document.createElement('span');
            dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:' + color + ';flex-shrink:0;';

            li.appendChild(checkbox);
            li.appendChild(label);
            li.appendChild(target);
            li.appendChild(dot);
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

    loadYear(2019);

    document.getElementById('shark-search').addEventListener('input', function () {
        var query = this.value.toLowerCase();
        document.querySelectorAll('#shark-list li').forEach(function (li) {
            var name = li.querySelector('.shark-name').textContent.toLowerCase();
            li.style.display = name.includes(query) ? 'flex' : 'none';
        });
    });

    var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        maxZoom: 19
    });

    document.getElementById('btn-dark').addEventListener('click', function () {
        document.body.classList.toggle('dark');
        var isDark = document.body.classList.contains('dark');
        this.textContent = isDark ? '☀️' : '🌙';
        if (isDark) {
            map.removeLayer(map._layers[Object.keys(map._layers)[0]]);
            darkLayer.addTo(map);
        } else {
            map.removeLayer(darkLayer);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19
            }).addTo(map);
        }
    });

} catch (e) {
    document.getElementById('map-placeholder').style.display = 'flex';
    document.getElementById('map').style.display = 'none';
    console.error("Erreur d'initialisation de la carte :", e);
}
