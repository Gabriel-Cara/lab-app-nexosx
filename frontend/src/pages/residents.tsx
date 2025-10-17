import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";
import { Resident } from "../types";

const residentSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  role: z.enum(["ADMIN", "PORTEIRO", "MORADOR"]),
  apartment: z.string().optional(),
  password: z.string().min(6),
  building: z.string().optional(),
  vehicle: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type ResidentForm = z.infer<typeof residentSchema>;

export const ResidentsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: residents, isLoading } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => (await api.get<Resident[]>("/auth/users")).data,
    enabled: user?.role !== "MORADOR",
  });

  const form = useForm<ResidentForm>({
    resolver: zodResolver(residentSchema),
    defaultValues: { role: "MORADOR" },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: ResidentForm) => (await api.post("/auth/users", payload)).data,
    onSuccess: () => {
      toast.success("Usuário criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      form.reset({ role: "MORADOR" });
    },
    onError: () => toast.error("Não foi possível criar o usuário"),
  });

  if (user?.role === "MORADOR") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus dados cadastrais</CardTitle>
          <CardDescription>Informações de contato para conferência junto à administração.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Nome:</span> {user.name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Apartamento:</span> {user.apartment ?? "Não informado"}
          </div>
          <p className="text-xs text-muted-foreground">
            Caso seja necessário atualizar algum dado, procure a portaria ou administração.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gestão de usuários</h2>
          <p className="text-sm text-muted-foreground">Cadastre moradores, porteiros e administradores em poucos cliques.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" /> Novo usuário
          </CardTitle>
          <CardDescription>Envie credenciais iniciais e personalize o perfil do morador.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Maria Silva" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="maria@email.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <select
                id="role"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("role")}
              >
                <option value="MORADOR">Morador</option>
                <option value="PORTEIRO">Porteiro</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apartment">Apartamento</Label>
              <Input id="apartment" placeholder="Torre 1 - 32B" {...form.register("apartment")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha inicial</Label>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">Bloco/Torre</Label>
              <Input id="building" placeholder="Torre A" {...form.register("building")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Veículo</Label>
              <Input id="vehicle" placeholder="Ex: Ford Ka ABC-1234" {...form.register("vehicle")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergencyContact">Contato de emergência</Label>
              <Input id="emergencyContact" placeholder="Nome + Telefone" {...form.register("emergencyContact")} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de usuários</CardTitle>
          <CardDescription>Acompanhe quem tem acesso ao condomínio e seus perfis.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Apartamento</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents?.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">{resident.name}</TableCell>
                  <TableCell>{resident.email}</TableCell>
                  <TableCell>
                    <Badge variant={resident.role === "ADMIN" ? "default" : resident.role === "PORTEIRO" ? "secondary" : "outline"}>
                      {resident.role.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{resident.apartment ?? "--"}</TableCell>
                  <TableCell>{format(new Date(resident.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                </TableRow>
              ))}
              {!isLoading && residents?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
