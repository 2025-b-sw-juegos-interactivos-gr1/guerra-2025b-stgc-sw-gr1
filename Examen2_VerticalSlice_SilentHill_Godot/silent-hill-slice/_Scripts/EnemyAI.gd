extends CharacterBody3D

# --- CONFIGURACIÓN ---
enum State {IDLE, STALK, ATTACK} # Definimos los estados posibles
var current_state = State.IDLE

@export var speed = 2.5 # Velocidad de persecución
@export var detection_range = 10.0 # A qué distancia te ve
@export var attack_range = 1.5 # A qué distancia te pega

# Variable para guardar quién es el jugador
var player = null
var attack_cooldown = 0.0 # Cooldown para no atacar constantemente

func _ready():
	# Al iniciar, buscamos al jugador. 
	# IMPORTANTE: El Player debe estar en el grupo "Player" para que esto funcione.
	player = get_tree().get_first_node_in_group("Player")

func _physics_process(_delta):
	# Si no encontramos al jugador, no hacemos nada para evitar errores
	if not player:
		return

	var dist_to_player = global_position.distance_to(player.global_position)
	
	# Actualizar cooldown de ataque
	if attack_cooldown > 0:
		attack_cooldown -= _delta

	# --- MÁQUINA DE ESTADOS ---
	match current_state:
		State.IDLE:
			# Comportamiento: Quieto esperando.
			# Transición: Si el jugador entra en rango -> Cambiar a STALK
			if dist_to_player < detection_range:
				current_state = State.STALK
				print("Enemigo: ¡Te vi!")
		
		State.STALK:
			# Comportamiento: Mirar y Moverse hacia el jugador
			# look_at hace que el enemigo rote para encarar al jugador. 
			# Usamos Vector3(x, position.y, z) para que no mire hacia arriba/abajo, solo rote en el suelo.
			look_at(Vector3(player.global_position.x, position.y, player.global_position.z), Vector3.UP)
			
			# Calculamos la dirección y aplicamos velocidad
			velocity = position.direction_to(player.global_position) * speed
			move_and_slide()
			
			# Transición: Si está muy cerca -> ATACAR
			if dist_to_player < attack_range:
				current_state = State.ATTACK
			
			# Transición: Si el jugador se escapa -> VOLVER A IDLE
			if dist_to_player > detection_range * 1.5:
				current_state = State.IDLE
				print("Enemigo: Se escapó...")
				
		State.ATTACK:
			# Comportamiento: Hacer daño
			if attack_cooldown <= 0:
				print("Enemigo: ¡GOLPE!")
				# Llamar a la función de daño del jugador
				if player.has_method("take_damage"):
					player.take_damage()
				attack_cooldown = 1.0 # 1 segundo entre golpes
			
			# Lógica simple de cooldown: Si el jugador se aleja un poco, volver a perseguir
			if dist_to_player > attack_range:
				current_state = State.STALK
