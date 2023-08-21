import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ModalBox from '../Components/ModalBox';
import Warning from '../Components/Warning';
import { localNetwork } from '../localNetwork';
import './Profile.css';

axios.defaults.withCredentials = true;

const Profile = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [originalUserInfo, setOriginalUserInfo] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModalBox, setShowModalBox] = useState(false);
    const [inputsValid, setInputsValid] = useState({
        first_name: true,
        last_name: true
    });
    const [currentSearch, setCurrentSearch] = useState('');
    const [filteredFriends, setFilteredFriends] = useState([]);
    const [target, setTartget] = useState(null);

    useEffect(() => {
        const filteredList = currentSearch
        ? userInfo.friends.filter((friend) =>
            friend.authorName.toLowerCase().includes(currentSearch.toLowerCase())
        )
        : userInfo.friends;
        setFilteredFriends(filteredList);
    }, [currentSearch, userInfo])

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            await axios.get(`${localNetwork}/`)
                .then((response) => {
                    if (response.data.loggedIn) {
                        const user = response.data.user;
                        setUserInfo(user);
                        setOriginalUserInfo(user);
                        setIsLoggedIn(true);
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
        }
    };

    const handleEdit = () => {
        setIsEditing(!isEditing);
    }
    
    const handleCancel = () => {
        setIsEditing(!isEditing);
        setUserInfo({ ...originalUserInfo });
        setInputsValid({
            first_name: true,
            last_name: true
        })
    }

    const handleSave = () => {
        setShowModalBox(true);
    }

    const handleInputsChange = (event) => {
        setUserInfo((prevInfo) => ({
            ...prevInfo,
            [event.target.id]: event.target.value
        }));

        if (event.target.id === 'first_name') {
            if (event.target.value === '') {
                setInputsValid((prevStatus) => ({
                    ...prevStatus,
                    first_name: false
                }))
            } else {
                setInputsValid((prevStatus) => ({
                    ...prevStatus,
                    first_name: true
                }))
            }
        } else if (event.target.id === 'last_name') {
            if (event.target.value === '') {
                setInputsValid((prevStatus) => ({
                    ...prevStatus,
                    last_name: false
                }))
            } else {
                setInputsValid((prevStatus) => ({
                    ...prevStatus,
                    last_name: true
                }))
            }
        }
    }

    const handleModalBox = async (event) => {
        if (event.target.className === 'yes') {
            if (target) {
                axios.patch(`${localNetwork}/unfriend`, {
                    user: userInfo,
                    target
                })
                    .then((response) => {
                        setUserInfo(response.data.user);
                    })
            } else {
                await axios.patch(`${localNetwork}/users/update/${userInfo._id}`, {
                    userInfo
                })
                fetchUserInfo();
                setIsEditing(!isEditing);
            }
        }
        setShowModalBox(false);
    }

    const handleChat = async (friend) => {
        const user_1_id = userInfo._id;
        const user_2_id = friend.authorID;
        let conversationID = '';
        const response = await axios.get(`${localNetwork}/conversation`, {
            params: {
                user_1_id,
                user_2_id
            }
        });
        if (response.data.message === 'Not Found') {
            const result = await axios.post(`${localNetwork}/conversation`, {
                participants: [user_1_id, user_2_id],
                messages: [],
                participantsInfo: [
                    {
                        userID: user_1_id,
                        username: userInfo.first_name + ' ' + userInfo.last_name,
                        avatar: userInfo.avatar
                    },
                    {
                        userID: user_2_id,
                        username: friend.authorName,
                        avatar: friend.avatar
                    }
                ]
            })
            conversationID = result.data.insertedId;
        } else {
            conversationID = response.data.conversation._id;
        }
        navigate('/dashboard', { state: conversationID })
    }

    const handleUnfriend = (friend) => {
        setTartget(friend);
        setShowModalBox(true);
    }
    
    if (isLoggedIn && filteredFriends) {
        return (
            <div className='profile'>
                <div className='user-avatar-friends'>
                    <div className='user-avatar'>
                        <div className='avatar-frame'>
                            <img 
                                src={`data:image/svg+xml;utf8,${encodeURIComponent(userInfo.avatar)}`}
                                alt="User's Avatar"
                            />
                        </div>
                        <div className='user-basic-info'>
                            <h3>{userInfo.first_name + ' ' + userInfo.last_name}</h3>
                            <p>@{userInfo.username}</p>
                        </div>
                    </div>
                    <div className='user-friends'>
                        <div className='user-friends-container'>
                            <div className='friends-header'>
                                <h2>Friends</h2>
                                <div className='friends-circle'>
                                    <span className='friend-count'>{filteredFriends.length}</span>
                                </div>
                            </div>
                            <div className='friend-search'>
                                <input 
                                    type="text" 
                                    placeholder='Search friends'
                                    value={currentSearch}
                                    onChange={(e) => setCurrentSearch(e.target.value)}
                                />
                                <span className='search-icon'><i className="fa-solid fa-magnifying-glass"></i></span>
                            </div>
                        </div>
                        <div className='list-friends'>
                            {filteredFriends.map((friend, index) => (
                                <div 
                                    key={index}
                                    className='friend'
                                >
                                    <div>
                                        <img 
                                            src={`data:image/svg+xml;utf8,${encodeURIComponent(friend.avatar)}`}
                                            alt="Friend's Avatar"
                                            className='friend-avatar'
                                        />
                                    </div>
                                    <div className='friend-name'>
                                        <p>{friend.authorName}</p>
                                    </div>
                                    <div className='options-circle' title='Send a message' onClick={() => handleChat(friend)}>
                                        <i className="fa-regular fa-message"></i>
                                    </div>
                                    <div className='options-circle' title='Unfriend' onClick={() => handleUnfriend(friend)}>
                                        <i className="fa-solid fa-user-xmark"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className='user-details'>
                    <div className='user-details-header'>
                        <h1>Profile Details</h1>
                        {!isEditing ? (
                            <button className='details-edit edit' onClick={handleEdit}>
                                <i className="fa-solid fa-pen"></i>
                                <p>Edit</p>
                            </button>
                        ) : (
                            <div className='custom-flex'>
                                <button className='details-edit cancel' onClick={handleCancel}>
                                    <i className="fa-solid fa-xmark"></i>
                                    <p>Cancel</p>
                                </button>
                                <button className='details-edit save' onClick={handleSave} disabled={!inputsValid.first_name || !inputsValid.last_name}>
                                    <i className="fa-solid fa-floppy-disk"></i>
                                    <p>Save</p>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className='user-details-body'>
                        <div className='user-details-body-container'>
                            {/* First Name & Last Name */}
                            <div className="form-floating custom-width">
                                <input 
                                    type="text" 
                                    className={inputsValid.first_name ? "form-control" : "form-control is-invalid"} 
                                    id="first_name"
                                    value={userInfo.first_name}
                                    onChange={handleInputsChange}
                                    disabled={!isEditing}
                                />
                                <label htmlFor="first_name">First Name</label>
                                {!inputsValid.first_name && <Warning errorType='empty'/>}
                            </div>
                            <div className="form-floating custom-width">
                                <input 
                                    type="text" 
                                    className={inputsValid.last_name ? "form-control" : "form-control is-invalid"}
                                    id="last_name"
                                    value={userInfo.last_name}
                                    onChange={handleInputsChange}
                                    disabled={!isEditing}
                                />
                                <label htmlFor="last_name">Last Name</label>
                                {!inputsValid.last_name && <Warning errorType='empty'/>}
                            </div>
                            {/* Username & Email */}
                            <div className="form-floating custom-width">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="username"
                                    value={userInfo.username}
                                    onChange={handleInputsChange} 
                                    disabled
                                />
                                <label htmlFor="username">Username</label>
                            </div>
                            <div className="form-floating custom-width">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="email"
                                    value={userInfo.email}
                                    onChange={handleInputsChange} 
                                    disabled
                                />
                                <label htmlFor="email">Email</label>
                            </div>
                            {/* Date Of Birth & Phone Number */}
                            <div className="form-floating custom-width">
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    id="birthday"
                                    value={userInfo.birthday}
                                    onChange={handleInputsChange}
                                    disabled={!isEditing}
                                />
                                <label htmlFor="birthday">Date of Birth</label>
                            </div>
                            <div className="form-floating custom-width">
                                <input 
                                    type="tel" 
                                    className="form-control" 
                                    id="phone"
                                    value={userInfo.phone}
                                    onChange={handleInputsChange}
                                    disabled={!isEditing} 
                                />
                                <label htmlFor="phone">Phone Number</label>
                            </div>
                            {/* Gender & Country */}
                            <div className="form-floating custom-width">
                                <select value={userInfo.gender} className="form-select" id="gender" onChange={handleInputsChange} disabled={!isEditing}>
                                    <option value=''>Select your gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                                <label htmlFor="gender">Gender</label>
                            </div>
                            <div className="form-floating custom-width">
                                <select value={userInfo.country} className="form-select" id="country" onChange={handleInputsChange} disabled={!isEditing}>
                                    <option value=''>Select your country</option>
                                    <option value="Afghanistan">Afghanistan</option>
                                    <option value="Aland Islands">Aland Islands</option>
                                    <option value="Albania">Albania</option>
                                    <option value="Algeria">Algeria</option>
                                    <option value="American Samoa">American Samoa</option>
                                    <option value="Andorra">Andorra</option>
                                    <option value="Angola">Angola</option>
                                    <option value="Anguilla">Anguilla</option>
                                    <option value="Antarctica">Antarctica</option>
                                    <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                                    <option value="Argentina">Argentina</option>
                                    <option value="Armenia">Armenia</option>
                                    <option value="Aruba">Aruba</option>
                                    <option value="Australia">Australia</option>
                                    <option value="Austria">Austria</option>
                                    <option value="Azerbaijan">Azerbaijan</option>
                                    <option value="Bahamas">Bahamas</option>
                                    <option value="Bahrain">Bahrain</option>
                                    <option value="Bangladesh">Bangladesh</option>
                                    <option value="Barbados">Barbados</option>
                                    <option value="Belarus">Belarus</option>
                                    <option value="Belgium">Belgium</option>
                                    <option value="Belize">Belize</option>
                                    <option value="Benin">Benin</option>
                                    <option value="Bermuda">Bermuda</option>
                                    <option value="Bhutan">Bhutan</option>
                                    <option value="Bolivia">Bolivia</option>
                                    <option value="Bonaire, Sint Eustatius and Saba">Bonaire, Sint Eustatius and Saba</option>
                                    <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                                    <option value="Botswana">Botswana</option>
                                    <option value="Bouvet Island">Bouvet Island</option>
                                    <option value="Brazil">Brazil</option>
                                    <option value="British Indian Ocean Territory">British Indian Ocean Territory</option>
                                    <option value="Brunei Darussalam">Brunei Darussalam</option>
                                    <option value="Bulgaria">Bulgaria</option>
                                    <option value="Burkina Faso">Burkina Faso</option>
                                    <option value="Burundi">Burundi</option>
                                    <option value="Cambodia">Cambodia</option>
                                    <option value="Cameroon">Cameroon</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Cape Verde">Cape Verde</option>
                                    <option value="Cayman Islands">Cayman Islands</option>
                                    <option value="Central African Republic">Central African Republic</option>
                                    <option value="Chad">Chad</option>
                                    <option value="Chile">Chile</option>
                                    <option value="China">China</option>
                                    <option value="Christmas Island">Christmas Island</option>
                                    <option value="Cocos (Keeling) Islands">Cocos (Keeling) Islands</option>
                                    <option value="Colombia">Colombia</option>
                                    <option value="Comoros">Comoros</option>
                                    <option value="Congo">Congo</option>
                                    <option value="Congo, Democratic Republic of the Congo">Congo, Democratic Republic of the Congo</option>
                                    <option value="Cook Islands">Cook Islands</option>
                                    <option value="Costa Rica">Costa Rica</option>
                                    <option value="Cote D'Ivoire">Cote D'Ivoire</option>
                                    <option value="Croatia">Croatia</option>
                                    <option value="Cuba">Cuba</option>
                                    <option value="Curacao">Curacao</option>
                                    <option value="Cyprus">Cyprus</option>
                                    <option value="Czech Republic">Czech Republic</option>
                                    <option value="Denmark">Denmark</option>
                                    <option value="Djibouti">Djibouti</option>
                                    <option value="Dominica">Dominica</option>
                                    <option value="Dominican Republic">Dominican Republic</option>
                                    <option value="Ecuador">Ecuador</option>
                                    <option value="Egypt">Egypt</option>
                                    <option value="El Salvador">El Salvador</option>
                                    <option value="Equatorial Guinea">Equatorial Guinea</option>
                                    <option value="Eritrea">Eritrea</option>
                                    <option value="Estonia">Estonia</option>
                                    <option value="Ethiopia">Ethiopia</option>
                                    <option value="Falkland Islands (Malvinas)">Falkland Islands (Malvinas)</option>
                                    <option value="Faroe Islands">Faroe Islands</option>
                                    <option value="Fiji">Fiji</option>
                                    <option value="Finland">Finland</option>
                                    <option value="France">France</option>
                                    <option value="French Guiana">French Guiana</option>
                                    <option value="French Polynesia">French Polynesia</option>
                                    <option value="French Southern Territories">French Southern Territories</option>
                                    <option value="Gabon">Gabon</option>
                                    <option value="Gambia">Gambia</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Germany">Germany</option>
                                    <option value="Ghana">Ghana</option>
                                    <option value="Gibraltar">Gibraltar</option>
                                    <option value="Greece">Greece</option>
                                    <option value="Greenland">Greenland</option>
                                    <option value="Grenada">Grenada</option>
                                    <option value="Guadeloupe">Guadeloupe</option>
                                    <option value="Guam">Guam</option>
                                    <option value="Guatemala">Guatemala</option>
                                    <option value="Guernsey">Guernsey</option>
                                    <option value="Guinea">Guinea</option>
                                    <option value="Guinea-Bissau">Guinea-Bissau</option>
                                    <option value="Guyana">Guyana</option>
                                    <option value="Haiti">Haiti</option>
                                    <option value="Heard Island and Mcdonald Islands">Heard Island and McDonald Islands</option>
                                    <option value="Holy See (Vatican City State)">Holy See (Vatican City State)</option>
                                    <option value="Honduras">Honduras</option>
                                    <option value="Hong Kong">Hong Kong</option>
                                    <option value="Hungary">Hungary</option>
                                    <option value="Iceland">Iceland</option>
                                    <option value="India">India</option>
                                    <option value="Indonesia">Indonesia</option>
                                    <option value="Iran, Islamic Republic of">Iran, Islamic Republic of</option>
                                    <option value="Iraq">Iraq</option>
                                    <option value="Ireland">Ireland</option>
                                    <option value="Isle of Man">Isle of Man</option>
                                    <option value="Israel">Israel</option>
                                    <option value="Italy">Italy</option>
                                    <option value="Jamaica">Jamaica</option>
                                    <option value="Japan">Japan</option>
                                    <option value="Jersey">Jersey</option>
                                    <option value="Jordan">Jordan</option>
                                    <option value="Kazakhstan">Kazakhstan</option>
                                    <option value="Kenya">Kenya</option>
                                    <option value="Kiribati">Kiribati</option>
                                    <option value="Korea, Democratic People's Republic of">Korea, Democratic People's Republic of</option>
                                    <option value="Korea, Republic of">Korea, Republic of</option>
                                    <option value="Kosovo">Kosovo</option>
                                    <option value="Kuwait">Kuwait</option>
                                    <option value="Kyrgyzstan">Kyrgyzstan</option>
                                    <option value="Lao People's Democratic Republic">Lao People's Democratic Republic</option>
                                    <option value="Latvia">Latvia</option>
                                    <option value="Lebanon">Lebanon</option>
                                    <option value="Lesotho">Lesotho</option>
                                    <option value="Liberia">Liberia</option>
                                    <option value="Libyan Arab Jamahiriya">Libyan Arab Jamahiriya</option>
                                    <option value="Liechtenstein">Liechtenstein</option>
                                    <option value="Lithuania">Lithuania</option>
                                    <option value="Luxembourg">Luxembourg</option>
                                    <option value="Macao">Macao</option>
                                    <option value="Macedonia, the Former Yugoslav Republic of">Macedonia, the Former Yugoslav Republic of</option>
                                    <option value="Madagascar">Madagascar</option>
                                    <option value="Malawi">Malawi</option>
                                    <option value="Malaysia">Malaysia</option>
                                    <option value="Maldives">Maldives</option>
                                    <option value="Mali">Mali</option>
                                    <option value="Malta">Malta</option>
                                    <option value="Marshall Islands">Marshall Islands</option>
                                    <option value="Martinique">Martinique</option>
                                    <option value="Mauritania">Mauritania</option>
                                    <option value="Mauritius">Mauritius</option>
                                    <option value="Mayotte">Mayotte</option>
                                    <option value="Mexico">Mexico</option>
                                    <option value="Micronesia, Federated States of">Micronesia, Federated States of</option>
                                    <option value="Moldova, Republic of">Moldova, Republic of</option>
                                    <option value="Monaco">Monaco</option>
                                    <option value="Mongolia">Mongolia</option>
                                    <option value="Montenegro">Montenegro</option>
                                    <option value="Montserrat">Montserrat</option>
                                    <option value="Morocco">Morocco</option>
                                    <option value="Mozambique">Mozambique</option>
                                    <option value="Myanmar">Myanmar</option>
                                    <option value="Namibia">Namibia</option>
                                    <option value="Nauru">Nauru</option>
                                    <option value="Nepal">Nepal</option>
                                    <option value="Netherlands">Netherlands</option>
                                    <option value="Netherlands Antilles">Netherlands Antilles</option>
                                    <option value="New Caledonia">New Caledonia</option>
                                    <option value="New Zealand">New Zealand</option>
                                    <option value="Nicaragua">Nicaragua</option>
                                    <option value="Niger">Niger</option>
                                    <option value="Nigeria">Nigeria</option>
                                    <option value="Niue">Niue</option>
                                    <option value="Norfolk Island">Norfolk Island</option>
                                    <option value="Northern Mariana Islands">Northern Mariana Islands</option>
                                    <option value="Norway">Norway</option>
                                    <option value="Oman">Oman</option>
                                    <option value="Pakistan">Pakistan</option>
                                    <option value="Palau">Palau</option>
                                    <option value="Palestinian Territory, Occupied">Palestinian Territory, Occupied</option>
                                    <option value="Panama">Panama</option>
                                    <option value="Papua New Guinea">Papua New Guinea</option>
                                    <option value="Paraguay">Paraguay</option>
                                    <option value="Peru">Peru</option>
                                    <option value="Philippines">Philippines</option>
                                    <option value="Pitcairn">Pitcairn</option>
                                    <option value="Poland">Poland</option>
                                    <option value="Portugal">Portugal</option>
                                    <option value="Puerto Rico">Puerto Rico</option>
                                    <option value="Qatar">Qatar</option>
                                    <option value="Reunion">Reunion</option>
                                    <option value="Romania">Romania</option>
                                    <option value="Russian Federation">Russian Federation</option>
                                    <option value="Rwanda">Rwanda</option>
                                    <option value="Saint Barthelemy">Saint Barthelemy</option>
                                    <option value="Saint Helena">Saint Helena</option>
                                    <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                                    <option value="Saint Lucia">Saint Lucia</option>
                                    <option value="Saint Martin">Saint Martin</option>
                                    <option value="Saint Pierre and Miquelon">Saint Pierre and Miquelon</option>
                                    <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
                                    <option value="Samoa">Samoa</option>
                                    <option value="San Marino">San Marino</option>
                                    <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                                    <option value="Saudi Arabia">Saudi Arabia</option>
                                    <option value="Senegal">Senegal</option>
                                    <option value="Serbia">Serbia</option>
                                    <option value="Serbia and Montenegro">Serbia and Montenegro</option>
                                    <option value="Seychelles">Seychelles</option>
                                    <option value="Sierra Leone">Sierra Leone</option>
                                    <option value="Singapore">Singapore</option>
                                    <option value="Sint Maarten">St Martin</option>
                                    <option value="Slovakia">Slovakia</option>
                                    <option value="Slovenia">Slovenia</option>
                                    <option value="Solomon Islands">Solomon Islands</option>
                                    <option value="Somalia">Somalia</option>
                                    <option value="South Africa">South Africa</option>
                                    <option value="South Georgia and the South Sandwich Islands">South Georgia and the South Sandwich Islands</option>
                                    <option value="South Sudan">South Sudan</option>
                                    <option value="Spain">Spain</option>
                                    <option value="Sri Lanka">Sri Lanka</option>
                                    <option value="Sudan">Sudan</option>
                                    <option value="Suriname">Suriname</option>
                                    <option value="Svalbard and Jan Mayen">Svalbard and Jan Mayen</option>
                                    <option value="Swaziland">Swaziland</option>
                                    <option value="Sweden">Sweden</option>
                                    <option value="Switzerland">Switzerland</option>
                                    <option value="Syrian Arab Republic">Syrian Arab Republic</option>
                                    <option value="Taiwan, Province of China">Taiwan, Province of China</option>
                                    <option value="Tajikistan">Tajikistan</option>
                                    <option value="Tanzania, United Republic of">Tanzania, United Republic of</option>
                                    <option value="Thailand">Thailand</option>
                                    <option value="Timor-Leste">Timor-Leste</option>
                                    <option value="Togo">Togo</option>
                                    <option value="Tokelau">Tokelau</option>
                                    <option value="Tonga">Tonga</option>
                                    <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                                    <option value="Tunisia">Tunisia</option>
                                    <option value="Turkey">Turkey</option>
                                    <option value="Turkmenistan">Turkmenistan</option>
                                    <option value="Turks and Caicos Islands">Turks and Caicos Islands</option>
                                    <option value="Tuvalu">Tuvalu</option>
                                    <option value="Uganda">Uganda</option>
                                    <option value="Ukraine">Ukraine</option>
                                    <option value="United Arab Emirates">United Arab Emirates</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="United States">United States</option>
                                    <option value="United States Minor Outlying Islands">United States Minor Outlying Islands</option>
                                    <option value="Uruguay">Uruguay</option>
                                    <option value="Uzbekistan">Uzbekistan</option>
                                    <option value="Vanuatu">Vanuatu</option>
                                    <option value="Venezuela">Venezuela</option>
                                    <option value="Viet Nam">Viet Nam</option>
                                    <option value="Virgin Islands, British">Virgin Islands, British</option>
                                    <option value="Virgin Islands, U.s.">Virgin Islands, U.s.</option>
                                    <option value="Wallis and Futuna">Wallis and Futuna</option>
                                    <option value="Western Sahara">Western Sahara</option>
                                    <option value="Yemen">Yemen</option>
                                    <option value="Zambia">Zambia</option>
                                    <option value="Zimbabwe">Zimbabwe</option>
                                </select>
                                <label htmlFor="country">Country</label>
                            </div>
                        </div>
                    </div>
                </div>
                {showModalBox 
                && 
                <ModalBox 
                    show={handleModalBox}
                    type={target ? 'checking-unfriend' : 'checking'}
                    message={target ? `Are you sure that you want to unfriend ${target.authorName}?` : 'Do you want to save your changes?'}
                />
                }
            </div>
        )
    } else {
        return (
            <ModalBox
                show={handleModalBox}
                type='unauthorized'
                message='Please log in to access this page.'
            />
        )
    }
}

export default Profile