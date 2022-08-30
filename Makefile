all		:	build
		cd sources/ && docker-compose up -d

build	:
		cd sources/ &&  docker-compose  up -d --build 

down	:
		cd sources/ &&  docker-compose down

clean	:
		cd sources/ &&  docker-compose down -v --rmi all --remove-orphans

fclean	:	clean
		 docker system prune --volumes --all --force
		 rm -rf $(DATA_PATH)
		 docker network prune --force
		 docker volume prune --force
		 docker image prune --force

re		:	fclean all


.PHONY	:	all build down clean fclean re
