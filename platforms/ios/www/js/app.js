/*
 Initialization
 */

// Initializing the AngularJs app
var app = angular.module('PalmApp', ['ionic', 'firebase', 'hc.marked', 'ngCordova']);

// Setting up the local storage.
var permanentStorage = window.localStorage;

/*
 Remote Storage (firebase)
 */

var dataBase = new Firebase('https://palm-note.firebaseio.com/');


/*
 Routing
 */
app.config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/'); // redirects any non-listed urls to the main page of the app.

    // The main page of the app.
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'templates/home.html',
        controller: 'homeCtrl'
    });

    // Search result view
    $stateProvider.state('searchResults', {
        url: '/results/:searchTerm',
        templateUrl: 'templates/searchResults.html',
        controller: 'searchCtrl',
        resolve: {
            searchTerm: function ($stateParams) {
                return $stateParams.searchTerm;
            }
        }
    });

    // Single note view
    $stateProvider.state('palmNote', {
        url: '/palmNote/:palmNoteIndex',
        templateUrl: 'templates/palmNote.html',
        controller: 'palmNoteCtrl',
        resolve: {
            palmNoteIndex: function ($stateParams) {
                return $stateParams.palmNoteIndex;
            }
        }
    });

    // The settings page view
    $stateProvider.state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'settingsCtrl'
    });

    // The intro page view
    $stateProvider.state('intro', {
        url: '/intro',
        templateUrl: 'templates/intro.html',
        controller: 'introCtrl'
    });

});

/*
 Services
 */

// used to check the user login status
app.factory('$logincheck', function () {
    return function () {
        if (permanentStorage.getItem('authenticated') === 'true' && permanentStorage.getItem('uid') !== null) {
            return true;
        } else {
            return false;
        }
    };
});

// simple login service
app.factory("simpleLogin", ["$firebaseSimpleLogin",
    function ($firebaseSimpleLogin) {
        return $firebaseSimpleLogin(dataBase);
    }
]);

// returns the palm notes
app.factory("palmNotes", function ($firebase, simpleLogin) {
    var auth = simpleLogin;
    if (permanentStorage.getItem('authenticated') === 'true' && permanentStorage.getItem('uid') !== null) {
        return $firebase(dataBase.child(permanentStorage.getItem('uid')).child('palmNotes')).$asArray();
    } else {
        return [];
    }
});

// returns the settings
app.factory("settings", function ($firebase, simpleLogin) {
    var auth = simpleLogin;
    if (permanentStorage.getItem('authenticated') === 'true' && permanentStorage.getItem('uid') !== null) {
        return $firebase(dataBase.child(permanentStorage.getItem('uid')).child('settings')).$asObject();
    } else {
        return {
            user: {
                name: '',
                email: '',
                profilePic: ''
            },
            palmNote: {
                version: '0.0.4',
                theme: 'light',
                secretPin: '0000',
                secretPinB: true
            }
        };
    }
});




/*
 Initialization
 */

app.run(function ($logincheck, $location, settings) {

    // Login check
    if ($logincheck()) {
        $location.path('/');
        settings.$loaded().then(function (newSettings) {
            if (newSettings.palmNote.secretPinB === true) {
                showAds();
             }
            // Version check
            if (newSettings.palmNote.version != '0.0.4') {
                settings.palmNote.version = '0.0.4';
            }
        });
    } else {
        $location.path('/intro');
    }
});

/*
 Controllers
 */

app.controller('ContentCtrl', function ($scope, $ionicSideMenuDelegate, $ionicModal, $ionicSlideBoxDelegate, $timeout, $http, $sce, palmNotes, settings, $ionicPopup, $location, $ionicPopover, $cordovaBarcodeScanner) {

    /*
     Loading data
     */
    $scope.palmNotes = palmNotes;
    $scope.settings = settings;
    /*
     Initializing variables
     */

    // If statement is used to avoid crash on launch.
    if (permanentStorage.getItem('authenticated') === 'true' && permanentStorage.getItem('uid') !== null) {
        $scope.palmNotes.$loaded().then(function (notes) {
            $scope.numberOfNotes = notes.length;
        }, function () {
            permanentStorage.removeItem('authenticated');
            permanentStorage.removeItem('uid');
            window.location.reload();
        });
        $scope.palmNotes.$watch(function () {
            $scope.numberOfNotes = $scope.palmNotes.length;
        });
    }

    /*
     palmNote manipulation methods and attributes
     */

    // Attributes

    $scope.formData = {
        newNoteValue : '',
        newNoteType : 0,
        newNoteName : '',
        newNoteColor : 'textType'
    };


    // Modal Methods

    $ionicModal.fromTemplateUrl('templates/newPalmNote.html', {
        scope: $scope,
        animation: 'slide-in-up'

    }).then(function (modal) {
        $scope.NewPalmNoteModal = modal;
    });

    $scope.openNewPalmNoteModal = function (noteColor) {
        // reset everything to default.
        $scope.formData = {
            newNoteValue : '',
            newNoteType : 0,
            newNoteName : '',
            newNoteColor : 'textType'
        };
        $scope.GooleMapsSrc = '';
        $scope.setNoteColor(noteColor);
        // show the modal.
        $scope.NewPalmNoteModal.show();
        $timeout(function () {
            $ionicSlideBoxDelegate.update();
        });
    };

    $scope.closeNewPalmNoteModal = function () {
        $scope.NewPalmNoteModal.hide();
        $scope.NewPalmNoteModal.remove();
        $ionicModal.fromTemplateUrl('templates/newPalmNote.html', {
            scope: $scope,
            animation: 'slide-in-up'

        }).then(function (modal) {
            $scope.NewPalmNoteModal = modal;
        });
        $scope.NewPalmNoteModalEditor.remove();
        $ionicModal.fromTemplateUrl('templates/newPalmNoteEditor.html', {
            scope: $scope,
            animation: 'slide-in-right'

        }).then(function (modal) {
            $scope.NewPalmNoteModalEditor = modal;
        });
    };

    // Method for creating a new notebook.
    $scope.addPalmNote = function (noteName, noteValue, noteType) {
        var newNote = {
            name: noteName,
            value: noteValue,
            type: noteType,
            followUps: []
        };
        if (newNote.value === undefined) {
            var alertPopup = $ionicPopup.alert({
                title: 'Error!',
                template: 'The inputted value doesn\'t have a valid format!',
                okText: 'Ok'
            });
        }
        $scope.palmNotes.$add(newNote);
        $scope.closeNewPalmNoteModal();
    };

    // Method for updating note color
    $scope.setNoteColor = function (index) {
        $ionicSlideBoxDelegate.$getByHandle("addSlider").slide(index);
        if (index === 0) {
            $scope.formData.newNoteColor = 'textType';
        } else if (index === 1) {
            $scope.formData.newNoteColor = 'addressType';
        } else if (index === 2) {
            $scope.formData.newNoteColor = 'linkType';
        } else if (index === 3) {
            $scope.formData.newNoteColor = 'passwordType';
        } else if (index === 4) {
            $scope.formData.newNoteColor = 'phoneType';
        } else if (index === 5) {
            $scope.formData.newNoteColor = 'emailType';
        }
        // re Initializing the variables
        $scope.formData.newNoteName = '';
        $scope.formData.newNoteValue = '';
        $scope.GooleMapsSrc = '';
    };

    /*
     Google Maps methods and manipulation
     */

    //Initializing the addressArray
    var addressArray;

    $scope.updateAddress = function (addressText) {
        $http.get('http://maps.googleapis.com/maps/api/geocode/json?address=' + addressText + '&sensor=false')
            // After getting the results
            .then(function (results) {
                // If the call was successful
                if (results.data.status === "OK") {
                    // setting the addressArray to the results of the call.
                    addressArray = results.data;
                    // Url to be used in google maps iframe src.
                    $scope.GooleMapsSrc = 'https://www.google.com/maps/embed/v1/place?key=AIzaSyCuD7GXWfGRg-tbFBjno02hjPODQVtWbpI&q=' + addressText;
                    // Setting the note value to the properly formatted address.
                    $scope.formData.newNoteValue = addressArray.results[0].formatted_address;
                    console.log($scope.newNoteValue);
                }
            });
    };
    // helper function for trusting a url to be used withing an iframe.
    $scope.trustSrc = function (src) {
        return $sce.trustAsResourceUrl(src);
    };

    /*
     UI Tweaks
     */

    // side menu toggle left.
    $scope.toggleLeft = function () { // used to handle the side menu
        $ionicSideMenuDelegate.toggleLeft();
    };
    // Back button
    $scope.goBack = function () {
        window.history.back();
    };

    //location watcher
    $scope.$on('$locationChangeStart', function(event) {
        if ($location.path().indexOf('results') >= 0) {
            $scope.currentLocation = 1;
        } else if ($location.path().indexOf('palmNote') >= 0) {
            $scope.currentLocation = 2;
            // updating the scope
            palmNoteScope = angular.element(document.getElementById('section')).scope().$parent;
            $ionicPopover.fromTemplateUrl('templates/singlePalmNotePopOver.html', {
                scope: palmNoteScope,
            }).then(function(popover) {
                $scope.popover = popover;
            });
        } else if ($location.path().indexOf('settings') >= 0) {
            $scope.currentLocation = 3;
        } else {
            $scope.currentLocation = 0;
        }
    });

    /*
     Popover
     */

    $scope.openPopover = function($event) {
        $scope.popover.show($event);
    };
    $scope.closePopover = function() {
        $scope.popover.hide();
    };
    $scope.$on('$destroy', function() {
        $scope.popover.remove();
    });

    /*
     Barcode Scanner
     */

    $scope.scanBarCode = function() {
        $cordovaBarcodeScanner.scan().then(function(imageData) {
            $scope.formData.newNoteValue = imageData.text;
            if ($scope.newNoteColor === 'addressType') {
                $scope.addressText = imageData.text;
                $scope.updateAddress($scope.formData.newNoteValue);
            }

        }, function(err) {
            // An error occured. Show a message to the user

        });
    };


    /*
    OCR feature
     */

    $scope.OCR = function () {

    };

    /*
    Expand Editor
     */

    $ionicModal.fromTemplateUrl('templates/newPalmNoteEditor.html', {
        scope: $scope,
        animation: 'slide-in-right'

    }).then(function (modal) {
        $scope.NewPalmNoteModalEditor = modal;
    });

    $scope.openNewPalmNoteModalEditor = function () {
        $scope.NewPalmNoteModalEditor.show();
    };

    $scope.closeNewPalmNoteModalEditor = function () {
        $scope.NewPalmNoteModalEditor.hide();
    };

    $scope.updateValue = function (newVal) {
      $scope.formData.newNoteValue = newVal;
    };

    /*
    Video features
     */

    $ionicModal.fromTemplateUrl('templates/video.html', {
        scope: $scope,
        animation: 'slide-in-up'

    }).then(function (modal) {
        $scope.videoModal = modal;
    });

    $scope.addVideo = function () {
        $scope.videoModal.show();
        ZiggeoApi.Events.on("submitted", function (data) {
            $scope.newNoteVideoKey = data.video.token;
            $scope.videoAdded();
        });
    };


    $scope.videoAdded = function () {
        $scope.videoModal.hide();
    };


});

app.controller('sideMenuCtrl', function ($scope, $ionicSideMenuDelegate, settings, $location, $ionicPopup) {
    /*
     Loading Information
     */
    $scope.settings = settings; // loading the settings
    $scope.searchTerm = '';
    /*
     UI-Tweaks
     */
    $scope.toggleLeft = function () { // used to handle the side menu
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.search = function (searchTerm) {
        $scope.toggleLeft();
        $location.path('/results/' + searchTerm);
    };

    $scope.logout = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Logout',
            template: 'Are you sure you want logout? This might cause loss of some data if you are not connected to the internet.',
            okText: 'Logout',
            okType: 'button-assertive'

        });
        confirmPopup.then(function (res) {
            if (res) {
                permanentStorage.removeItem('authenticated');
                permanentStorage.removeItem('uid');
                window.location.reload();
            }
        });
    };

});

app.controller('homeCtrl', function ($scope) {

});

app.controller('searchCtrl', function ($scope, searchTerm, palmNotes, settings, $location, $ionicPopup) {
    /*
     Loading data
     */

    $scope.palmNotes = palmNotes;
    $scope.settings = settings;

    /*
     Initializing variables
     */

    $scope.searchTerm = searchTerm;

    // Used to determine the type of the category being viewed.
    $scope.catType = 0;

    // Used to filter the notes loop
    $scope.filterTerm = {
        name: '',
        value: '',
        type: ''
    };

    // Used to convert the search term into the type number
    if (searchTerm === 'texts') {
        $scope.catType = 0;
    } else if (searchTerm === 'addresses') {
        $scope.catType = 1;
    } else if (searchTerm === 'links') {
        $scope.catType = 2;
    } else if (searchTerm === 'passwords') {
        $scope.catType = 3;
    } else if (searchTerm === 'numbers') {
        $scope.catType = 4;
    } else if (searchTerm === 'emails') {
        $scope.catType = 5;
    } else { // Used to toggle the simple search
        $scope.catType = 6;
    }

    // To set the fiter term when it is not on the simple search
    if ($scope.catType !== 6) {
        $scope.filterTerm.type = $scope.catType;
    } else { // when simple search is on
        $scope.filterTerm.name = searchTerm;
    }


    /*
     Utilities
     */

    // Used to return the icon of the note given the type number.
    $scope.getIcon = function (noteType) {
        if (noteType === 0) {
            return 'ion-ios7-paper-outline';
        } else if (noteType === 1) {
            return 'ion-ios7-location-outline';
        } else if (noteType === 2) {
            return 'ion-ios7-bookmarks-outline';
        } else if (noteType === 3) {
            return 'ion-ios7-locked-outline';
        } else if (noteType === 4) {
            return 'ion-ios7-telephone-outline';
        } else {
            return 'ion-ios7-email-outline';
        }

    };

    // Used to update the catType when the slide changes.
    $scope.updateCatType = function (index) {
        // setting the filter
        if (index !== 6) {
            $scope.filterTerm.name = ''; // resetting the search term
            $scope.filterTerm.type = index; // updating the active type
        } else {
            $scope.filterTerm.type = ''; // resetting the active type
        }
        // updating the location path [disabled for now]
        /*
        if (index === 0) {
            $location.path('/results/texts')
        } else if (index === 1) {
            $location.path('/results/addresses')

        } else if (index === 2) {
            $location.path('/results/links')

        } else if (index === 3) {
            $location.path('/results/passwords')

        } else if (index === 4) {
            $location.path('/results/numbers')

        } else if (index === 5) {
            $location.path('/results/emails')
        } else {
            $location.path('/results/')
        }
        */
    };

    // Used to narrow the search
    $scope.setType = function (type) {
        $scope.filterTerm.type = type;
    };

    // Get the number of notes
    $scope.numberOfNotes = 1;

    /*
    Note manipulation
     */

    $scope.deletePalmNote = function (ID) {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete',
            template: 'Are you sure you want to delete this palm note?',
            okText: 'Delete',
            okType: 'button-assertive'

        });
        confirmPopup.then(function (res) {
            if (res) {
                $scope.palmNotes.$remove($scope.palmNotes[$scope.palmNotes.$indexFor(ID)]);
            }
        });
    };

    // Copy to clibboard
    $scope.copy = function (content) {
        cordova.plugins.clipboard.copy(content);
    };

});

app.controller('palmNoteCtrl', function ($scope, palmNoteIndex, $ionicPopup, $timeout, $sce, settings, $location, palmNotes, marked, $ionicModal) {
    /*
     Loading data
     */
    $scope.settings = settings;
    $scope.palmNotes = palmNotes;
    $scope.palmNote = $scope.palmNotes.$getRecord(palmNoteIndex);

    /*
     Markdown parser
     */

    $scope.renderedMarkDown = marked($scope.palmNote.value);


    /*
     Initializing the co
     ntroller
     */
    $scope.GooleMapsSrc = 'https://www.google.com/maps/embed/v1/place?key=AIzaSyCuD7GXWfGRg-tbFBjno02hjPODQVtWbpI&q=' + $scope.palmNote.value;
    $scope.secretPin = $scope.settings.palmNote.secretPin;
    $scope.inputtedPin = '';
    $scope.showPassword = false;

    /*
     Note manipulation methods and attributes
     */
    $scope.deletePalmNote = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete "' + $scope.palmNote.name + '"',
            template: 'Are you sure you want to delete this palm note?',
            okText: 'Delete',
            okType: 'button-assertive'

        });
        confirmPopup.then(function (res) {
            if (res) {
                $scope.palmNotes.$remove($scope.palmNotes[$scope.palmNotes.$indexFor(palmNoteIndex)]);
                $scope.$parent.closePopover();
                document.getElementById('palmNote').className = document.getElementById('palmNote').className + " animated zoomOutDown";
                setTimeout(function () {
                    window.history.back();
                },1000);
            }
        });
    };

    /*
     Utilities
     */

    // helper function for trusting a url to be used withing an iframe.
    $scope.trustSrc = function (src) {
        return $sce.trustAsResourceUrl(src);
    };

    // Show password if pin is correct
    $scope.revealPassword = function (inputtedPin) {
        if ($scope.secretPin === inputtedPin) {
            $scope.showPassword = true;
        }
    };

    // Back button
    $scope.goBack = function () {
        window.history.back();
    };

    // Copy to clibboard
    $scope.copy = function () {
        $scope.$parent.closePopover();
        cordova.plugins.clipboard.copy($scope.palmNote.value);
    };

    /*
    Reminders
     */

    if ($scope.palmNote.reminder === undefined || $scope.palmNote.reminder === null) {
        $scope.reminderSet = false;
    } else {
        $scope.reminderSet = true;
        $scope.reminderMessage = (new Date($scope.palmNote.reminder)).toDateString();
    }

    // Adding a new reminder method.
    $scope.addReminder = function () {
        $ionicPopup.prompt({
            title: 'When is this due?',
            inputType: 'date'
        }).then(function(reminderDate) {
            // turn reminder data into a date object
            reminderDate = new Date(reminderDate);
            // Setting time to midnight
            reminDerDate = reminderDate.setHours(0,0,0,0);
            // update the date
            reminderDate.setDate(reminderDate.getDate() + 1);
            // adding the reminder
            $scope.palmNotes[$scope.palmNotes.$indexFor(palmNoteIndex)].reminder = Date.parse(reminderDate);
            // Saving the data back to the remote storage
            $scope.palmNotes.$save($scope.palmNotes[$scope.palmNotes.$indexFor(palmNoteIndex)]);
            // Update the message
            $scope.reminderMessage = reminderDate.toDateString();
            // updating the ngSwitch
            $scope.reminderSet = true;
            // Notification variables
            var notificationMessage = 'You wanted to be reminded of this note on ' + $scope.reminderMessage;
            // Adding the notification
            window.plugin.notification.local.add({
                id: palmNoteIndex,
                title: $scope.palmNote.name,
                message: notificationMessage,
                autoCancel: true,
                date: reminderDate
            });
        });
    };

    // Saving changes to remote storage
    $scope.saveChanges = function (reminderDate) {
        // turn reminder data into a date object
        reminderDate = new Date(reminderDate);
        // update the date
        reminderDate.setDate(reminderDate.getDate() + 1);
        // set the date
        $scope.palmNotes[$scope.palmNotes.$indexFor(palmNoteIndex)].reminder = Date.parse(reminderDate);
        // update the remote storage
        $scope.palmNotes.$save($scope.palmNotes[$scope.palmNotes.$indexFor(palmNoteIndex)]);
        // set the string
        $scope.reminderMessage = reminderDate.toDateString();
    };

    // Function to modify the reminder time
    $scope.editReminder = function () {
        $ionicPopup.prompt({
            title: 'When is this due?',
            inputType: 'date'
        }).then(function(reminderData) {
            $scope.saveChanges(reminderData);
        });
    };

    // Removing the reminder
    $scope.removeReminder = function () {
        // removing the reminder
        $scope.palmNotes[$scope.palmNotes.$indexFor(palmNoteIndex)].reminder = null;
        // Saving the data back to the remote storage
        $scope.palmNotes.$save($scope.palmNotes[$scope.palmNotes.$indexFor(palmNoteIndex)]);
        // reset the view
        $scope.reminderSet = false;
    };

    /*
    Note follow-ups
     */

    $ionicModal.fromTemplateUrl('templates/newFollowUp.html', {
        scope: $scope,
        animation: 'slide-in-left'

    }).then(function (modal) {
        $scope.followUpEditor = modal;
    });

    $scope.openFollowUpEditor = function () {
        $scope.followUpEditor.show();
    };

    $scope.closeFollowUpEditor = function () {
        $scope.followUpEditor.hide();
    };

    $scope.updateValue = function (newVal) {
        $scope.newNoteValue = newVal;
    };

    $scope.followUpsExist = false;

    $scope.followUpCheck = function () {
        if ($scope.palmNote.followUps === undefined || $scope.palmNote.followUps === null) {
            $scope.followUpsExist = true;
        } else {
            $scope.followUpsExist = false;
        }
    };

    /*
    InAppBrowser
     */

    $scope.openInBrowser = function () {
        window.open($scope.palmNote.value, '_blank', 'location=yes');
    };

});

app.controller('settingsCtrl', function ($scope, $ionicPopup, settings, $firebase) {
    /*
     Loading the data
     */
    $scope.settings = settings; // loading the settings

    /*
     Initialization
     */
    $scope.setSecretPin = false;

    /*
     Methods and attributes for modifying settings
     */
    $scope.askForPin = function () {
        $ionicPopup.prompt({
            title: 'Enter Your Secret Pin',
            inputType: 'tel',
            inputPlaceholder: 'secret pin'
        }).then(function (res) {
            if (res === $scope.settings.palmNote.secretPin) {
                $scope.setSecretPin = true;
            } else {
                var alertPopup = $ionicPopup.alert({
                    title: 'Wrong pin!',
                    template: "The pin you entered is incorrect. Try entering '0000' if you haven't set any pins",
                    okType: 'button-assertive'
                });
            }
        });
    };
    $scope.deleteAll = function () {
        $ionicPopup.prompt({
            title: 'Enter Your Secret Pin to proceed with this action',
            inputType: 'tel',
            inputPlaceholder: 'secret pin'
        }).then(function (res) {
            if (res === $scope.settings.palmNote.secretPin) {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Delete all data',
                    template: 'Are you sure you want delete all your data? You will not be able to redo this.',
                    okText: 'Delete',
                    okType: 'button-assertive'

                });
                confirmPopup.then(function (res) {
                    if (res) {
                        if ($scope.settings.user.name !== '' || $scope.settings.user.email !== '') {
                            $firebase(dataBase).$set(permanentStorage.getItem('uid'), null);
                        }
                        permanentStorage.removeItem('uid');
                        permanentStorage.removeItem('authenticated');
                        window.location.reload();
                    }
                });
            } else {
                var alertPopup = $ionicPopup.alert({
                    title: 'Wrong pin!',
                    template: "The pin you entered is incorrect. Try entering '0000' if you haven't set any pins",
                    okType: 'button-assertive'
                });

            }
        });
    };
    $scope.logout = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Logout',
            template: 'Are you sure you want logout? This might cause loss of some data if you are not connected to the internet.',
            okText: 'Logout',
            okType: 'button-assertive'

        });
        confirmPopup.then(function (res) {
            if (res) {
                permanentStorage.removeItem('authenticated');
                permanentStorage.removeItem('uid');
                window.location.reload();
            }
        });
    };
});

app.controller('introCtrl', function ($firebase, $scope, $location, simpleLogin, palmNotes, settings, $ionicPopup) {
    /*
     Loading the data
     */

    $scope.settings = settings; // loading the settings

    /*
     Initialization
     */

    $scope.initialLogin = false;
    $scope.auth = simpleLogin;

    /*
     Login Methods
     */

    $scope.login = function () {
        var waitToLoad = true;
        $scope.auth.$login('google', {
            scope: 'https://www.googleapis.com/auth/plus.me'
        }).then(function (user) {
            // check to see if the data already exists in the database.
            if ($firebase(dataBase.child(user.uid).child('settings')).$asArray() !== null) {
                // loadint the original settings
                var originalSettings = $firebase(dataBase.child(user.uid).child('settings')).$asObject();
                originalSettings.$loaded().then(function () {
                    $scope.settings = {
                        user: {
                            name: user.displayName,
                            email: user.email,
                            profilePic: user.thirdPartyUserData.picture
                        },
                        palmNote: {
                            version: '0.0.4',
                            theme: 'light',
                            secretPin: originalSettings.palmNote.secretPin,
                            secretPinB: originalSettings.palmNote.secretPinB
                        }
                    };
                    // save the settings to the database
                    $firebase(dataBase.child(user.uid)).$set('settings', $scope.settings);
                });
            } else {
                $scope.settings.user = {
                    name: user.displayName,
                    email: user.email,
                    profilePic: user.thirdPartyUserData.picture
                };
                // save the settings to the database
                $firebase(dataBase.child(user.uid)).$set('settings', $scope.settings);
                waitToLoad = false;
            }
            // check to see if the data already exists in the database.
            if ($firebase(dataBase.child(user.uid).child('palmNotes')).$asArray() !== null) {
                // Do nothing
            } else {
                // If the palm notes don't exist, add it to the database.
                $firebase(dataBase.child(user.uid)).$set('palmNotes', palmNotes);
            }
            // set the uid to local storage
            permanentStorage.setItem('uid', user.uid);
            // proceed to the next step
            if (waitToLoad) {
                originalSettings.$loaded().then(function () {
                    $scope.initialLogin = true;
                });
            } else {
                $scope.initialLogin = true;
            }
        }, function (error) {
            // Ionic alert popup.
            var alertPopup = $ionicPopup.alert({
                title: 'Something went wrong',
                template: error.message,
                okType: 'button-assertive'
            });
        });
    };

    $scope.loginFB = function () {
        var waitToLoad = true;
        $scope.auth.$login('facebook', {
            scope: 'email'
        }).then(function (user) {
            // check to see if the data already exists in the database.
            if ($firebase(dataBase.child(user.uid).child('settings')).$asArray() !== null) {
                // loadint the original settings
                var originalSettings = $firebase(dataBase.child(user.uid).child('settings')).$asObject();
                originalSettings.$loaded().then(function () {
                    $scope.settings = {
                        user: {
                            name: user.displayName,
                            email: user.thirdPartyUserData.email,
                            profilePic: user.thirdPartyUserData.picture.data.url
                        },
                        palmNote: {
                            version: '0.0.4',
                            theme: 'light',
                            secretPin: originalSettings.palmNote.secretPin,
                            secretPinB: originalSettings.palmNote.secretPinB
                        }
                    };
                    // save the settings to the database
                    $firebase(dataBase.child(user.uid)).$set('settings', $scope.settings);
                });
            } else {
                $scope.settings.user = {
                    name: user.displayName,
                    email: user.thirdPartyUserData.email,
                    profilePic: user.thirdPartyUserData.picture.data.url

                };
            }
            // save the settings to the database
            $firebase(dataBase.child(user.uid)).$set('settings', $scope.settings);
            waitToLoad = false;
            // check to see if the data already exists in the database.
            if ($firebase(dataBase.child(user.uid).child('palmNotes')).$asArray() !== null) {
                // Do nothing
            } else {
                // If the palm notes don't exist, add it to the database.
                $firebase(dataBase.child(user.uid)).$set('palmNotes', palmNotes);
            }
            // set the uid to local storage
            permanentStorage.setItem('uid', user.uid);
            // proceed to the next step
            if (waitToLoad) {
                originalSettings.$loaded().then(function () {
                    $scope.initialLogin = true;
                });
            } else {
                $scope.initialLogin = true;
            }
        }, function (error) {
            // Ionic alert popup.
            var alertPopup = $ionicPopup.alert({
                title: 'Something went wrong',
                template: error.message,
                okType: 'button-assertive'
            });
        });
    };

    $scope.proceed = function () {
        permanentStorage.setItem('authenticated', true);
        window.location.reload();
    };

});

/*
 Directives
 */

// Submit forms by pressing enter
app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});

/*
Filters
 */

app.filter('reverse', function () {
    return function (items) {
        return items.slice().reverse();
    };
});

/*
 Helper Functions
 */

var applySettingsScope = function (scopeCtrl, newVal) {
    var angularElement = document.querySelector('[ng-controller=' + scopeCtrl + ']');
    var $scope = angular.element(angularElement).scope();
    $scope.$apply(function () {
        $scope.settings = newVal;
    });
};


// Ads function
function showAds() {
    if (device.platform === 'iOS') {
        //admob.requestInterstitialAd({interstitialAdId: "ca-app-pub-4403501246038809/7695173779", autoShowInterstitial: true});
    } else {
        //admob.requestInterstitialAd({interstitialAdId: "ca-app-pub-4403501246038809/9171906976", autoShowInterstitial: true});
    }
};

