extends Area3D

var player_in_zone = false
@onready var interaction_label = $CanvasLayer/InteractionLabel
@onready var door_audio_player = $DoorAudioPlayer

func _ready():
	# Conectamos la señal por código (es más robusto para Github)
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _on_body_entered(body):
	# Verificamos si es el jugador usando el grupo que configuramos antes
	if body.is_in_group("Player"):
		player_in_zone = true
		interaction_label.visible = true
		print("UI: [Presiona E para Escapar]") # Simulación de UI

func _on_body_exited(body):
	if body.is_in_group("Player"):
		player_in_zone = false
		interaction_label.visible = false
		print("UI: [Zona de salida abandonada]")

func _input(event):
	# Si el jugador está en la zona y presiona la tecla E
	if player_in_zone and event is InputEventKey:
		if event.pressed and event.keycode == KEY_E:
			win_game()

func win_game():
	print("--- ¡ESCAPASTE DEL CALLEJÓN! ---")
	print("--- FIN DEL VERTICAL SLICE ---")
	
	# Reproducir sonido de puerta metálica (TAREA C)
	if door_audio_player.stream != null:
		door_audio_player.play()
		# Esperar a que termine el sonido antes de cerrar
		await door_audio_player.finished
	
	# Aquí cerramos el juego o reiniciamos
	get_tree().quit() # Cierra la ventana del juego
