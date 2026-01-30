extends Area3D

var player_in_zone = false

func _ready():
	# Conectamos la señal por código (es más robusto para Github)
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _on_body_entered(body):
	# Verificamos si es el jugador usando el grupo que configuramos antes
	if body.is_in_group("Player"):
		player_in_zone = true
		print("UI: [Presiona E para Escapar]") # Simulación de UI

func _on_body_exited(body):
	if body.is_in_group("Player"):
		player_in_zone = false
		print("UI: [Zona de salida abandonada]")

func _input(event):
	# Si el jugador está en la zona y presiona la tecla de interactuar
	if player_in_zone and event.is_action_pressed("ui_accept"): 
		# "ui_accept" suele ser Enter o Espacio por defecto en Godot
		win_game()

func win_game():
	print("--- ¡ESCAPASTE DEL CALLEJÓN! ---")
	print("--- FIN DEL VERTICAL SLICE ---")
	# Aquí cerramos el juego o reiniciamos
	get_tree().quit() # Cierra la ventana del juego
