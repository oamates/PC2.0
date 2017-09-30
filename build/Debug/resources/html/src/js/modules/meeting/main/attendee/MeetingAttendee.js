/**
 * Created by waouyang on 16/4/27.
 */
(function (uc) {
    var _this = null;
    uc.modules.meeting.MeetingAttendee = {
        attendeeContainerHtml: '<div class="meeting-attendee">'
        + '<div class="attendee-list">'
        + '<div class="accepted-list"></div>'
        + '<div class="reject-list"></div>'
        + '<div class="pending-list"></div>'
        + '</div>'
        + '</div>',
        attendeeItemHtml: "<a class='attendee' href='javascript:void(0);'>"
        + "<img class='attendee-image' src='../images/avatar_default.png' />"
        + "<span class='attendee-name attendee-name-middle'></span>"
        + "</a>",
        init: function (parentNode) {
            _this = this;

            this._init(parentNode);
            this.bindEvent();
        },

        _init: function (parentNode) {
            this.container = $(this.attendeeContainerHtml).appendTo(parentNode);
            this.attendeeList = $('.attendee-list', this.container);
            this.acceptedList = $('.accepted-list', this.attendeeList);
            this.rejectedList = $('.reject-list', this.attendeeList);
            this.pendingList = $('.pending-list', this.attendeeList);

            this.isHost = false;
            this.pageNum = 0;
            this.attendeeCountPerPage = 30;
            this.isLoadingMoreAttendee = false;
        },

        bindEvent: function () {
            this.attendeeList.on("click", ".attendee ", function (e) {
                var userId = Number($(e.target).parent().attr("user"));
                if (userId) {
                    uc.IUIService.showPopupContactProfile(userId);
                }
            });

            this.attendeeList.on('scroll', function () {
                if (!_this.isLoadingMoreAttendee && _this.showingCount < _this.sortedAttendees.length) {
                    if ($(this).height() + $(this)[0].scrollTop >= $(this)[0].scrollHeight - 60) {
                        _this._loadMoreAttendees();
                    }
                }
            })
        },

        updateMeetingInfo: function (meetingInfo) {
            if (this.meetingInfo && meetingInfo && this.meetingInfo.eventId == meetingInfo.eventId) {
                this.meetingInfo = meetingInfo;
                this.showAttendees(meetingInfo);
            }
        },

        showAttendees: function (meetingInfo) {
            if (!meetingInfo) {
                return;
            }

            this.meetingInfo = meetingInfo;
            this.isHost = this._isHost(meetingInfo);

            this._groupAttendees();
            this._showAttendees();
        },

        _groupAttendees: function () {
            this.sortedAttendees = [];
            this.acceptedAttendeeCount = 1;
            this.rejectedAttendeeCount = 0;
            this.pendingAttendeeCount = 0;

            var attendees = this.meetingInfo.attendees;
            if (attendees && attendees.length) {
                attendees.map(function (attendee) {
                    switch (attendee.status) {
                        case uc.constants.Meeting.AttendeeStatus.Accepted:
                            _this.acceptedAttendeeCount++;
                            _this.sortedAttendees.push(attendee);
                            break;
                        case uc.constants.Meeting.AttendeeStatus.Reject:
                            _this.rejectedAttendeeCount++;
                            if (_this.isHost) {
                                _this.sortedAttendees.push(attendee);
                            }
                            break;
                        case uc.constants.Meeting.AttendeeStatus.Pending:
                            _this.pendingAttendeeCount++;
                            _this.sortedAttendees.push(attendee);
                            break;
                    }
                })
            }

            this.sortedAttendees.push({
                isHost: true,
                account: this.meetingInfo.hostId + "",
                type: uc.constants.Meeting.AttendeeType.User,
                status: uc.constants.Meeting.AttendeeStatus.Accepted
            });

            this.sortedAttendees.sort(this.compareFunc);
        },

        compareFunc: function (attendee1, attendee2) {
            if (attendee1.isHost && !attendee2.isHost) {
                return -1;
            } else if (!attendee1.isHost && attendee2.isHost) {
                return 1
            } else {
                var status1 = _this._resetStatus(attendee1.status);
                var status2 = _this._resetStatus(attendee2.status);
                return status1 - status2;
            }
        },

        _resetStatus: function (status) {
            var result = 0;
            switch (status) {
                case uc.constants.Meeting.AttendeeStatus.Accepted:
                    result = 0;
                    break;
                case uc.constants.Meeting.AttendeeStatus.Reject:
                    result = 1;
                    break;
                case uc.constants.Meeting.AttendeeStatus.Pending:
                    result = 2;
                    break;
            }
            return result;
        },

        _isHost: function (meetingInfo) {
            var loginUserId = uc.IContactService.getCurrentUserInfo().userId;

            //return loginUserId === meetingInfo.hostId || meetingInfo.hostId == meetingInfo.authorizerId;
            return true;
        },

        _loadMoreAttendees: function () {
            this.isLoadingMoreAttendee = true;
            this.pageNum++;
            this._showAttendees(true);
            this.isLoadingMoreAttendee = false;
        },

        _showAttendees: function (isShowingMore) {
            if (!isShowingMore) {
                this.acceptedList.empty();
                this.pendingList.empty();
                this.rejectedList.empty();

                this.showingCount = 0;
                this.index = 0;
            }

            var maxAttendeeCount = (this.pageNum + 1) * this.attendeeCountPerPage;
            var attendee;

            this.userIds = [];

            while (this.showingCount < maxAttendeeCount && this.showingCount < this.sortedAttendees.length) {
                attendee = this.sortedAttendees[this.showingCount];
                this._showAttendeeItem(attendee);
                this.showingCount++;
            }

            if (this.userIds.length > 0) {
                uc.IContactService.getBasicContactInfo(this.userIds);
            }
        },

        _showAttendeeItem: function (attendee) {
            var container;
            switch (attendee.status) {
                case uc.constants.Meeting.AttendeeStatus.Accepted:
                    container = this.acceptedList;
                    if (this.isHost && container.find('h1').length == 0) {
                        this.acceptedList.append("<h1>" + uc_resource.Meeting.Accepted + "(" + this.acceptedAttendeeCount + ")</h1>");
                    }
                    break;
                case uc.constants.Meeting.AttendeeStatus.Reject:
                    container = this.rejectedList;
                    if (this.isHost && container.find('h1').length == 0) {
                        this.rejectedList.append("<h1>" + uc_resource.Meeting.Rejected + "(" + this.rejectedAttendeeCount + ")</h1>");
                    }
                    break;
                case uc.constants.Meeting.AttendeeStatus.Pending:
                    container = this.pendingList;
                    if (this.isHost && container.find('h1').length == 0) {
                        this.pendingList.append("<h1>" + uc_resource.Meeting.Pending + "(" + this.pendingAttendeeCount + ")</h1>");
                    }
                    break;
            }

            var attendeeItem = $(this.attendeeItemHtml);
            attendeeItem.attr("user", attendee.account);
            attendeeItem.find("span.attendee-name").text(attendee.account);

            if (attendee.type == uc.constants.Meeting.AttendeeType.Mail) {
                attendeeItem.find("img.attendee-image").attr("src", "../images/contacts/contact-email-avatar.png");
            }

            if (attendee.isHost && attendee.type == uc.constants.Meeting.AttendeeStatus.Accepted) {
                attendeeItem.find('.attendee-name').after($('<span class="attendee-host">' + uc_resource.Meeting.HostName + '</span>'));
            }

            container.append(attendeeItem);

            if (attendee.type == uc.constants.Meeting.AttendeeType.User) {
                this.userIds.push(parseInt(attendee.account));
            } else {
                this.userIds.push(attendee.account)
            }
        },

        OnBasicContactInfoReceived: function (contacts) {
            if (contacts && contacts.length) {
                contacts.map(function (contact) {
                    if (_this.userIds.indexOf(contact.userId) != -1) {
                        _this._updateAttendeeView(contact);
                    }
                })
            }
        },

        _updateAttendeeView: function (contact) {
            var attendeeItem = this.attendeeList.find("a[user='" + contact.userId + "']");

            var $name = attendeeItem.find("span.attendee-name").text(contact.displayName);
            if (!attendeeItem.find("span.attendee-info").length) {
                $("<span class='attendee-info'></span>").appendTo(attendeeItem).text(contact.departmentName + " " + contact.position);
                $name.removeClass("attendee-name-middle");
            }
            if (contact.localAvatar) {
                attendeeItem.find("img.attendee-image").attr("src", contact.localAvatar);
            } else if (contact.remoteAvatarUrl) {
                uc.IUIService.downloadUserAvatar(contact.userId, contact.remoteAvatarUrl);
            }
        },

        OnUserAvatarDownloaded: function (userId, serverAvatarUrl, localAvatarUrl) {
            if (this.userIds.indexOf(userId) != -1) {
                this.attendeeList.find("a[user='" + userId + "']").find("img.attendee-image").attr("src", localAvatarUrl);
            }
        }
    }
})(uc);