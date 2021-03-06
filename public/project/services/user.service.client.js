(function () {
    angular
        .module('TrafficPost')
        .factory("UserService", UserService);

    function UserService($http) {
        api = {
            login: login,
            logout: logout,
            register: register,
            isLoggedIn: isLoggedIn,
            findUserByCredentials: findUserByCredentials,
            findUserById: findUserById,
            findUserByUsername: findUserByUsername,
            updateUser: updateUser,
            createUser: createUser,
            deleteUser: deleteUser,
            addLocationForUser: addLocationForUser,
            findAllUsers: findAllUsers,
            addUserForUser: addUserForUser,
            removeUserFromUser: removeUserFromUser
        }
        return api;

        function login(user) {
            return $http.post("/api/loginP", user);
        }

        function logout() {
            return $http.post("/api/logoutP");
        }

        function register(user) {
            return $http.post("/api/registerP", user);
        }

        function isLoggedIn() {
            return $http.get("/api/isLoggedInP");
        }

        function findUserByCredentials(username, password) {
            var attr1 = "username=" + username;
            var attr2 = "password=" + password;
            var url = "/api/userP?" + attr1 + "&" + attr2;
            return $http.get(url);
        }

        function findUserById(userId) {
            var url = "/api/userP/" + userId;
            return $http.get(url);
        }

        function findUserByUsername(username) {
            var attr1 = "username=" + username;
            var url = "/api/userP?" + attr1;
            return $http.get(url);
        }

        function updateUser(userId, user) {
            var url = "/api/userP/" + userId;
            return $http.put(url, user);
        }

        function createUser(user) {
            var newUser = {};
            //newUser._id = (new Date()).getTime() + "";
            newUser.username = user.username;
            newUser.password = user.password;
            var url = "/api/userP";
            return $http.post(url, newUser);
        }

        function deleteUser(userId) {
            var url = "/api/userP/" + userId;
            return $http.delete(url);

        }

        function addLocationForUser(userId, location) {
            var url = "/api/userP/" + userId + "/addlocation";
            return $http.post(url, location);
        }

        function findAllUsers(userId) {
            var url = "/api/userP/" + userId + "/all";
            return $http.get(url);
        }

        function addUserForUser(userId, user) {
            var url = "/api/userP/" + userId + "/addUser";
            return $http.post(url, user);
        }

        function removeUserFromUser(userId, friendId) {
            var url = "/api/userP/" + userId + "/removeUser/" + friendId;
            return $http.delete(url);
        }

    }

})();