"use client";

import type React from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
  Lock,
  Bell,
  Globe,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const SettingsSection = () => {
  const { logout } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    currency: "NGN",
    timezone: "Africa/Lagos",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    orderUpdates: true,
    newMessages: true,
    priceAlerts: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsChangingPassword(true);
    try {
      // API call to change password would go here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
    toast.success("Preference updated!");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    try {
      // API call to delete account would go here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast.success("Account deleted successfully");
      logout();
    } catch {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className='space-y-6'>
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Lock className='w-5 h-5' />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Change Password */}
          <div>
            <h3 className='mb-4 font-semibold text-lg'>Change Password</h3>
            <form onSubmit={handlePasswordChange} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='currentPassword'>Current Password</Label>
                <div className='relative'>
                  <Input
                    id='currentPassword'
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className='pr-10'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className='top-3 right-3 absolute text-gray-400 hover:text-gray-600'
                  >
                    {showCurrentPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='newPassword'>New Password</Label>
                <div className='relative'>
                  <Input
                    id='newPassword'
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className='pr-10'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className='top-3 right-3 absolute text-gray-400 hover:text-gray-600'
                  >
                    {showNewPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                <div className='relative'>
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className='pr-10'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='top-3 right-3 absolute text-gray-400 hover:text-gray-600'
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type='submit'
                disabled={isChangingPassword}
                className='bg-[#3bb85e] hover:bg-[#457753]'
              >
                {isChangingPassword
                  ? "Changing Password..."
                  : "Change Password"}
              </Button>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div className='pt-6 border-t'>
            <div className='flex justify-between items-center'>
              <div>
                <h3 className='font-semibold text-lg'>
                  Two-Factor Authentication
                </h3>
                <p className='text-gray-600 text-sm'>
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant='outline'>
                <Shield className='mr-2 w-4 h-4' />
                Enable 2FA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='w-5 h-5' />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <div>
                <Label htmlFor='emailNotifications'>Email Notifications</Label>
                <p className='text-gray-600 text-sm'>
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id='emailNotifications'
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("emailNotifications", checked)
                }
              />
            </div>

            <div className='flex justify-between items-center'>
              <div>
                <Label htmlFor='pushNotifications'>Push Notifications</Label>
                <p className='text-gray-600 text-sm'>
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch
                id='pushNotifications'
                checked={preferences.pushNotifications}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("pushNotifications", checked)
                }
              />
            </div>

            <div className='flex justify-between items-center'>
              <div>
                <Label htmlFor='smsNotifications'>SMS Notifications</Label>
                <p className='text-gray-600 text-sm'>
                  Receive notifications via SMS
                </p>
              </div>
              <Switch
                id='smsNotifications'
                checked={preferences.smsNotifications}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("smsNotifications", checked)
                }
              />
            </div>

            <div className='flex justify-between items-center'>
              <div>
                <Label htmlFor='orderUpdates'>Order Updates</Label>
                <p className='text-gray-600 text-sm'>
                  Get notified about order status changes
                </p>
              </div>
              <Switch
                id='orderUpdates'
                checked={preferences.orderUpdates}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("orderUpdates", checked)
                }
              />
            </div>

            <div className='flex justify-between items-center'>
              <div>
                <Label htmlFor='newMessages'>New Messages</Label>
                <p className='text-gray-600 text-sm'>
                  Get notified when you receive new messages
                </p>
              </div>
              <Switch
                id='newMessages'
                checked={preferences.newMessages}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("newMessages", checked)
                }
              />
            </div>

            <div className='flex justify-between items-center'>
              <div>
                <Label htmlFor='marketingEmails'>Marketing Emails</Label>
                <p className='text-gray-600 text-sm'>
                  Receive promotional emails and offers
                </p>
              </div>
              <Switch
                id='marketingEmails'
                checked={preferences.marketingEmails}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("marketingEmails", checked)
                }
              />
            </div>

            <div className='flex justify-between items-center'>
              <div>
                <Label htmlFor='priceAlerts'>Price Alerts</Label>
                <p className='text-gray-600 text-sm'>
                  Get notified when prices drop on items you're watching
                </p>
              </div>
              <Switch
                id='priceAlerts'
                checked={preferences.priceAlerts}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("priceAlerts", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Globe className='w-5 h-5' />
            General Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='gap-4 grid grid-cols-1 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='language'>Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) =>
                  handlePreferenceChange("language", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='en'>English</SelectItem>
                  <SelectItem value='ha'>Hausa</SelectItem>
                  <SelectItem value='ig'>Igbo</SelectItem>
                  <SelectItem value='yo'>Yoruba</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='currency'>Currency</Label>
              <Select
                value={preferences.currency}
                onValueChange={(value) =>
                  handlePreferenceChange("currency", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='NGN'>Nigerian Naira (₦)</SelectItem>
                  <SelectItem value='USD'>US Dollar ($)</SelectItem>
                  <SelectItem value='EUR'>Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='timezone'>Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) =>
                  handlePreferenceChange("timezone", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Africa/Lagos'>
                    West Africa Time (WAT)
                  </SelectItem>
                  <SelectItem value='UTC'>UTC</SelectItem>
                  <SelectItem value='America/New_York'>
                    Eastern Time (ET)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className='border-red-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <AlertTriangle className='w-5 h-5' />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='bg-red-50 p-4 border border-red-200 rounded-lg'>
            <h3 className='mb-2 font-semibold text-red-800 text-lg'>
              Delete Account
            </h3>
            <p className='mb-4 text-red-700 text-sm'>
              Once you delete your account, there is no going back. Please be
              certain. All your data, orders, and reviews will be permanently
              deleted.
            </p>

            {!showDeleteConfirm ? (
              <Button
                variant='outline'
                onClick={() => setShowDeleteConfirm(true)}
                className='hover:bg-red-50 border-red-300 text-red-600'
              >
                <Trash2 className='mr-2 w-4 h-4' />
                Delete Account
              </Button>
            ) : (
              <div className='space-y-3'>
                <div className='space-y-2'>
                  <Label htmlFor='deleteConfirm'>
                    Type <strong>DELETE</strong> to confirm:
                  </Label>
                  <Input
                    id='deleteConfirm'
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='DELETE'
                    className='border-red-300 focus:border-red-500 focus:ring-red-500'
                  />
                </div>
                <div className='flex gap-2'>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE"}
                    className='bg-red-600 hover:bg-red-700 text-white'
                  >
                    <Trash2 className='mr-2 w-4 h-4' />
                    Delete Account
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSection;
