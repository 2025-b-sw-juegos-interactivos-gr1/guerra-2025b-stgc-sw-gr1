extends CharacterBody3D

# --- CONFIGURACIÓN DE MOVIMIENTO ---
const SPEED = 5.0
const GRAVITY = 9.8
const JUMP_VELOCITY = 4.5

# --- CONFIGURACIÓN DE RADIO ---
@onready var radio_audio = $RadioStream # Asegúrate de que este nodo exista
@export var max_distance = 15.0 
@export var min_distance = 2.0  
@export var enemy_group = "Enemy"

func _physics_process(delta):
	# 1. APLICAR GRAVEDAD
	if not is_on_floor():
		velocity.y -= GRAVITY * delta

	# 2. DETECTAR INPUT (Movimiento con Flechas o WASD)
	# "ui_up", "ui_down", etc. vienen configurados por defecto en Godot
	var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	
	# Calculamos la dirección en base a hacia dónde mira el personaje
	var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	if direction:
		velocity.x = direction.x * SPEED
		velocity.z = direction.z * SPEED
	else:
		# Frenar si no tocamos teclas
		velocity.x = move_toward(velocity.x, 0, SPEED)
		velocity.z = move_toward(velocity.z, 0, SPEED)

	# 3. MOVER EL CUERPO (¡La magia de Godot!)
	move_and_slide()

	# 4. EJECUTAR LÓGICA DE RADIO
	update_radio_tension()

# Esta es la misma función que ya tenías, pero encapsulada para ordenar
func update_radio_tension():
	var closest_dist = 999.0
	var enemies = get_tree().get_nodes_in_group(enemy_group)
	
	if enemies.size() > 0:
		for enemy in enemies:
			var dist = global_position.distance_to(enemy.global_position)
			if dist < closest_dist:
				closest_dist = dist
		
		# Matemática de la Radio
		var tension = 1.0 - clamp((closest_dist - min_distance) / (max_distance - min_distance), 0.0, 1.0)
		
		if radio_audio:
			radio_audio.volume_db = linear_to_db(tension)
	else:
		if radio_audio:
			radio_audio.volume_db = linear_to_db(0)
