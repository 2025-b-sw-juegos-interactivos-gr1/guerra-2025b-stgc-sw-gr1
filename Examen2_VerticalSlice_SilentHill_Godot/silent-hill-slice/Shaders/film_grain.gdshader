shader_type canvas_item;
render_mode blend_add;

// Parámetros ajustables
uniform float grain_amount : hint_range(0.0, 1.0) = 0.25;
uniform float scan_line_amount : hint_range(0.0, 1.0) = 0.15;
uniform float vignette_amount : hint_range(0.0, 1.0) = 0.6;

// Función de ruido pseudo-aleatorio
float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
    // Empezar con transparencia total
    vec4 overlay = vec4(0.0, 0.0, 0.0, 0.0);
    
    // --- FILM GRAIN (Grano de película) ---
    float noise = random(UV + vec2(TIME * 0.5, TIME * 0.3));
    float grain = (noise - 0.5) * grain_amount;
    overlay.rgb += vec3(grain);
    
    // --- SCAN LINES (Líneas de escaneo VHS) ---
    float scanline = sin(UV.y * 800.0 + TIME * 2.0) * scan_line_amount;
    overlay.rgb -= vec3(scanline * 0.5);
    
    // --- VIGNETTE (Oscurecimiento en los bordes) ---
    vec2 center_dist = UV - vec2(0.5);
    float vignette_intensity = dot(center_dist, center_dist) * vignette_amount;
    overlay.rgb -= vec3(vignette_intensity * 0.3);
    
    // --- PARPADEO VHS OCASIONAL ---
    float flicker = sin(TIME * 15.0) * 0.01;
    overlay.rgb += vec3(flicker);
    
    overlay.a = 0.3;
    COLOR = overlay;
}
