(function () {
    var GATE_PASSWORD = 'Caluva2026';
    var STORAGE_KEY = 'caluva_gate_ok';

    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;

    // Ocultar todo de entrada para que no se vea un flash del sitio real
    document.documentElement.style.visibility = 'hidden';

    document.addEventListener('DOMContentLoaded', function () {
        var style = document.createElement('style');
        style.textContent =
            '#caluva-gate{position:fixed;inset:0;z-index:999999;background:#3a1c0d;' +
            'display:flex;align-items:center;justify-content:center;font-family:"Montserrat",sans-serif;}' +
            '#caluva-gate .gate-box{text-align:center;padding:2rem;max-width:90vw;}' +
            '#caluva-gate .gate-logo{font-weight:800;letter-spacing:-1px;font-size:clamp(2.5rem,8vw,4rem);' +
            'color:#ffffe6;margin-bottom:1rem;text-transform:uppercase;}' +
            '#caluva-gate .gate-text{color:rgba(255,255,230,0.75);font-size:0.85rem;' +
            'letter-spacing:0.05em;margin-bottom:2rem;}' +
            '#caluva-gate form{display:flex;gap:0.6rem;flex-wrap:wrap;justify-content:center;}' +
            '#caluva-gate input{font-family:inherit;font-size:0.95rem;padding:0.8rem 1.1rem;' +
            'border:1px solid rgba(255,255,230,0.35);background:transparent;color:#ffffe6;' +
            'border-radius:0;outline:none;min-width:220px;letter-spacing:0.05em;}' +
            '#caluva-gate input::placeholder{color:rgba(255,255,230,0.45);}' +
            '#caluva-gate button{font-family:inherit;font-weight:700;font-size:0.85rem;' +
            'letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;padding:0.8rem 1.4rem;' +
            'background:#ffffe6;color:#3a1c0d;border:none;transition:opacity 0.2s ease;}' +
            '#caluva-gate button:hover{opacity:0.85;}' +
            '#caluva-gate .gate-error{color:#e8b4a0;font-size:0.8rem;margin-top:1rem;letter-spacing:0.03em;}';
        document.head.appendChild(style);

        var gate = document.createElement('div');
        gate.id = 'caluva-gate';
        gate.innerHTML =
            '<div class="gate-box">' +
                '<div class="gate-logo">Caluva</div>' +
                '<p class="gate-text">SITIO EN CONSTRUCCIÓN — INGRESÁ LA CONTRASEÑA</p>' +
                '<form id="caluva-gate-form">' +
                    '<input type="password" id="caluva-gate-input" placeholder="CONTRASEÑA" autocomplete="off" required>' +
                    '<button type="submit">ENTRAR</button>' +
                '</form>' +
                '<p class="gate-error" id="caluva-gate-error" style="display:none;">Contraseña incorrecta, probá de nuevo.</p>' +
            '</div>';
        document.body.appendChild(gate);
        document.documentElement.style.visibility = 'visible';

        var input = document.getElementById('caluva-gate-input');
        var error = document.getElementById('caluva-gate-error');
        document.getElementById('caluva-gate-form').addEventListener('submit', function (e) {
            e.preventDefault();
            if (input.value === GATE_PASSWORD) {
                sessionStorage.setItem(STORAGE_KEY, '1');
                gate.remove();
            } else {
                error.style.display = 'block';
                input.value = '';
                input.focus();
            }
        });
        input.focus();
    });
})();
