(function () {
    'use strict';

    angular
    .module('app')
    .controller('DlistsController', DlistsController);

    DlistsController.$inject = ['UserService', '$rootScope'];
    function DlistsController(UserService, $rootScope) {
        var vm = this;

        vm.dlists = [];
        vm.newDlistName = null;
        vm.addItem = addItem;
        vm.deleteItem = deleteItem;

        vm.org_id = $rootScope.globals.currentUser.user_id;

        initController();

        function initController() {
            loadOrgdlist();
        }

        function loadOrgdlist()
        {
            UserService.GetDistributionLists(vm.org_id).then(function (response){ 
                if(response.success) 
                    vm.dlists = response.data.data;
                console.log("lists: ");
                console.log(vm.dlists);
                //$("#dlist_listview").listview("refresh");

            });
        }

        function deleteItem(dlist){
            console.log("deleting :" + dlist.list_name + " with id: " + dlist._id);
            vm.dlists.splice(vm.dlists.indexOf(dlist,1));
            UserService.DeleteSubscriber(dlist._id).then(function (response) 
            { 
                console.log(response.success)
            });
        }

      function addItem(){
        console.log("adding :" + vm.newDlistName);

        var dlist = {
            entity_id: vm.org_id,
            entity_type: "org",
            is_everyone: 0, 
            list_name: vm.newDlistName,
            subscribers: [],
            subscribers_number: 0, 
            total_num_of_tweets: 0,
            tweets_pages: 0
        };

        UserService.AddSubscriber(dlist).then(function (response) 
        { 
            console.log(response)
           // dlist._id = response.data.
        });

        loadOrgdlist();

    }
}

})();