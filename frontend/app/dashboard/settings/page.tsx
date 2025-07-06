"use client";
import { useAuth, UserData } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ChangePasswordDialog from "@/components/features/settings/change-password-dialog";
import LoadingScreen from "@/components/common/loading-screen";
import { fetchGraphQL } from "@/utils/gql-axios";

const userSettingsSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type UserSettingsFormValues = z.infer<typeof userSettingsSchema>;

function Settings() {
  const { user, loading: authLoading, logout } = useAuth();

  const [userData, setUserData] = useState<any>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  const [deleteMyAccount, setDeleteMyAccount] = useState<string>("");
  const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);

  const router = useRouter();

  const form = useForm<UserSettingsFormValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    form.reset(
      {
        name: user?.firstName || "",
        email: user?.email || "",
      },
      {
        keepDefaultValues: true,
      }
    );
  }, [user, authLoading, form]);

  useEffect(() => {
    setDeleteButtonDisabled(deleteMyAccount !== "delete my account");
  }, [deleteMyAccount]);

  const onDeleteAccount = async () => {
    try {
      if (!user?.id) return;

      await fetchGraphQL(`
        mutation DeleteAccount {
          deleteAccount
        }
    `);
      setSuccess("Account deleted successfully");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account");
    } finally {
      setDeleteAccountDialogOpen(false);
      logout();
      router.push("/login");
    }
  };

  const onSubmit = async (data: UserSettingsFormValues) => {
    if (!user?.id) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await fetchGraphQL(`
        mutation UpdateUser {
            updateUser(email: "${data.email}", name: "${data.name}")
        }
        `);
      setSuccess("Profile updated successfully");

      setUserData((prev: UserData) =>
        prev ? { ...prev, ...data } : undefined
      );
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <h3 className="font-medium">{userData?.name}</h3>
            <p className="text-muted-foreground text-sm">{userData?.email}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center">
                <ChangePasswordDialog
                  open={passwordDialogOpen}
                  onOpenChange={setPasswordDialogOpen}
                />

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col">
                  <h3 className="text-lg font-medium text-red-600 mb-2">
                    Delete your account
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteAccountDialogOpen(true)}
                    className="w-full md:w-auto md:self-start"
                    disabled={submitting}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>

              <Dialog
                open={deleteAccountDialogOpen}
                onOpenChange={setDeleteAccountDialogOpen}
              >
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-red-600">
                      Delete Your Account
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all of your data from our servers.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4">
                    <p className="font-medium mb-2">
                      Are you absolutely sure you want to delete your account?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please type &quot;delete my account&quot; to delete your
                      account.
                    </p>
                    <Input
                      className="mt-2"
                      placeholder="delete my account"
                      onChange={(e) => setDeleteMyAccount(e.target.value)}
                      value={deleteMyAccount}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteAccountDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={onDeleteAccount}
                      disabled={deleteButtonDisabled}
                    >
                      Delete My Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;
