extends CharacterBody3D

# Referencias
@onready var radio_audio = $RadioStream

# Configuración (Export permite editarlo en el Inspector)
@export var max_distance = 15.0 # Distancia donde empieza a sonar suave
@export var min_distance = 2.0  # Distancia donde suena fortísimo
@export var enemy_group = "Enemy" # El nombre del grupo de los enemigos

func _physics_process(delta):
	# 1. Buscamos al enemigo más cercano
	var closest_dist = 999.0
	var enemies = get_tree().get_nodes_in_group(enemy_group)
	
	if enemies.size() > 0:
		for enemy in enemies:
			var dist = global_position.distance_to(enemy.global_position)
			if dist < closest_dist:
				closest_dist = dist
		
		# 2. Matemática de la Radio (Inversa)
		# clamp asegura que el valor no se salga de 0 a 1
		var tension = 1.0 - clamp((closest_dist - min_distance) / (max_distance - min_distance), 0.0, 1.0)
		
		# 3. Aplicar volumen (linear_to_db convierte 0.0-1.0 a decibeles reales)
		# Si tension es 0, volumen es silencio (-80db). Si es 1, volumen es normal (0db).
		radio_audio.volume_db = linear_to_db(tension)
		
		# Debug visual en consola (para saber si funciona sin audio)
		if tension > 0:
			print("Nivel de Tensión: ", tension)
	else:
		# Si no hay enemigos, silencio total
		radio_audio.volume_db = linear_to_db(0)
