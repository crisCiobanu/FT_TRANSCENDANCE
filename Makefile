all		:	build
		cd srcs/ && sudo docker-compose up -d

build	:
		cd srcs/ && sudo docker-compose build

down	:
		cd srcs/ && sudo docker-compose down

clean	:
		cd srcs/ && sudo docker-compose down -v --rmi all --remove-orphans

fclean	:	clean
		sudo docker system prune --volumes --all --force
		sudo rm -rf $(DATA_PATH)
		sudo docker network prune --force
		sudo docker volume prune --force
		sudo docker image prune --force

re		:	fclean all


.PHONY	:	all build down clean fclean re
